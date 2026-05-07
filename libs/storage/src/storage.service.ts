import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import { Readable } from 'stream';

export interface UploadFileOptions {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface GetFileOptions {
  bucket: string;
  key: string;
}

export interface DeleteFileOptions {
  bucket: string;
  key: string;
}

export interface GeneratePresignedUrlOptions {
  bucket: string;
  key: string;
  expiresIn?: number; // in seconds, default 3600 (1 hour)
}

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private s3Client: S3Client;
  private readonly defaultBucket: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(StorageService.name);

    const storageConfig = this.configService.storageConfig;

    // Validate required configuration values
    if (!storageConfig.endpoint) {
      throw new Error(
        'HETZNER_STORAGE_ENDPOINT is not configured. Please set the environment variable.',
      );
    }

    if (!storageConfig.accessKeyId) {
      throw new Error(
        'HETZNER_STORAGE_ACCESS_KEY_ID is not configured. Please set the environment variable.',
      );
    }

    if (!storageConfig.secretAccessKey) {
      throw new Error(
        'HETZNER_STORAGE_SECRET_ACCESS_KEY is not configured. Please set the environment variable.',
      );
    }

    // Note: region has a default value of 'fsn1' in the configuration, so it's always defined
    this.defaultBucket = storageConfig.defaultBucket;

    // Configure S3Client for Hetzner Object Storage
    // Note: AWS SDK v3 automatically uses v4 signatures
    this.s3Client = new S3Client({
      endpoint: storageConfig.endpoint, // e.g., https://fsn1.your-objectstorage.com
      region: storageConfig.region, // e.g., fsn1
      credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
      },
      forcePathStyle: false, // Use virtual host-style addressing (path-style is "off")
    });

    this.logger.log('Storage service initialized');
  }

  async onModuleInit() {
    try {
      // Test connection by checking if default bucket exists
      if (this.defaultBucket) {
        await this.checkBucketExists(this.defaultBucket);
        this.logger.log(`Connected to Hetzner Object Storage (bucket: ${this.defaultBucket})`);
      } else {
        this.logger.warn('No default bucket configured');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Hetzner Object Storage', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // S3Client doesn't require explicit cleanup, but we can log
    this.logger.log('Storage service destroyed');
  }

  /**
   * Upload a file to Hetzner Object Storage
   */
  async uploadFile(
    options: UploadFileOptions,
  ): Promise<{ key: string; bucket: string; url?: string }> {
    const { bucket, key, body, contentType, metadata, acl = 'private' } = options;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
        ACL: acl,
        CacheControl: 'no-cache',
      });

      await this.s3Client.send(command);

      this.logger.debug(`File uploaded successfully: ${bucket}/${key}`);

      return {
        key,
        bucket,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  /**
   * Upload a file using the default bucket
   */
  async uploadFileToDefaultBucket(
    key: string,
    body: Buffer | Uint8Array | string | Readable,
    options?: Omit<UploadFileOptions, 'bucket' | 'key' | 'body'>,
  ): Promise<{ key: string; bucket: string }> {
    if (!this.defaultBucket) {
      throw new Error('Default bucket is not configured');
    }

    return this.uploadFile({
      bucket: this.defaultBucket,
      key,
      body,
      ...options,
    });
  }

  /**
   * Get a file from Hetzner Object Storage
   */
  async getFile(options: GetFileOptions): Promise<{
    body: Readable;
    contentType?: string;
    contentLength?: number;
  }> {
    const { bucket, key } = options;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error(`File not found: ${bucket}/${key}`);
      }

      return {
        body: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      this.logger.error(`Failed to get file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(options: GetFileOptions): Promise<boolean> {
    const { bucket, key } = options;

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`Failed to check file existence: ${bucket}/${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a file from Hetzner Object Storage
   */
  async deleteFile(options: DeleteFileOptions): Promise<void> {
    const { bucket, key } = options;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.debug(`File deleted successfully: ${bucket}/${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for temporary file access
   * Note: Maximum expiration is 7 days (604800 seconds) for AWS S3-compatible services
   */
  async generatePresignedUrl(options: GeneratePresignedUrlOptions): Promise<string> {
    const { bucket, key, expiresIn = 3600 } = options;

    // AWS S3 presigned URLs have a maximum expiration of 7 days
    const maxExpiration = 7 * 24 * 60 * 60; // 7 days in seconds
    const validExpiresIn = Math.min(expiresIn, maxExpiration);

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: validExpiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${bucket}/${key}`, error);
      throw error;
    }
  }

  /**
   * Generate a public URL for files with public-read ACL
   * For Hetzner Object Storage (S3-compatible), uses virtual-hosted style URLs
   */
  generatePublicUrl(bucket: string, key: string): string {
    const storageConfig = this.configService.storageConfig;
    const endpoint = storageConfig.endpoint;

    if (!endpoint) {
      throw new Error('Storage endpoint is not configured');
    }

    try {
      // Parse the endpoint URL
      const endpointUrl = new URL(endpoint);
      const hostname = endpointUrl.hostname;

      // For virtual-hosted style (forcePathStyle: false), the public URL is:
      // https://{bucket}.{hostname}/{key}
      // For Hetzner, the hostname might be like "fsn1.your-objectstorage.com"
      // So the public URL would be: https://{bucket}.fsn1.your-objectstorage.com/{key}

      // Extract the domain part (everything after the first dot)
      const domainParts = hostname.split('.');
      if (domainParts.length < 2) {
        // Fallback to path-style if we can't parse the hostname
        return `${endpoint}/${bucket}/${key}`;
      }

      // Construct virtual-hosted style URL: https://{bucket}.{hostname}/{key}
      const publicUrl = `${endpointUrl.protocol}//${bucket}.${hostname}/${key}`;
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to generate public URL: ${bucket}/${key}`, error);
      // Fallback to path-style URL
      return `${endpoint}/${bucket}/${key}`;
    }
  }

  /**
   * Check if a bucket exists
   */
  private async checkBucketExists(bucket: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: '.bucket-check', // Try to access a non-existent key to check bucket access
      });

      // If bucket doesn't exist or we don't have access, this will throw
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      // If it's a 404, the bucket might exist but the key doesn't (which is fine)
      // If it's a 403, we have access but the key doesn't exist (bucket exists)
      if (error.$metadata?.httpStatusCode === 404 || error.$metadata?.httpStatusCode === 403) {
        return true;
      }
      // Other errors might indicate bucket doesn't exist or no access
      this.logger.warn(`Could not verify bucket existence: ${bucket}`, error);
      return false;
    }
  }

  /**
   * Get the S3Client instance (for advanced usage)
   */
  getClient(): S3Client {
    return this.s3Client;
  }
}
