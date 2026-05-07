import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LoggerService } from '@kodi/logger';
import sharp from 'sharp';
import { fromBuffer } from 'file-type';

export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ProcessedFile {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalName: string;
  size: number;
}

@Injectable()
export class FileUploadService {
  // File size limits (in bytes)
  // Note: No file size limits - frontend handles any size restrictions
  private readonly MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

  // Allowed MIME types
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ];

  private readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  private readonly ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ];

  constructor(
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(FileUploadService.name);
  }

  /**
   * Validate file size and type
   */
  async validateFile(file: any, options: FileValidationOptions): Promise<void> {
    // Check file size (skip if maxSize is 0 = no limit)
    if (options.maxSize > 0 && file.size > options.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.formatBytes(options.maxSize)}`,
      );
    }

    // Detect actual file type from buffer
    const fileType = await fromBuffer(file.buffer);

    // Special handling for SVG files (text-based, file-type may not detect them)
    if (!fileType) {
      const isSvg = this.isSvgFile(file.buffer);
      if (isSvg && options.allowedMimeTypes.includes('image/svg+xml')) {
        // SVG detected and allowed, proceed with extension check if provided
        if (options.allowedExtensions) {
          const extension = this.getFileExtension(file.originalname);
          if (!options.allowedExtensions.includes(extension.toLowerCase())) {
            throw new BadRequestException(`File extension .${extension} is not allowed`);
          }
        }
        return;
      }
      throw new BadRequestException('Unable to detect file type');
    }

    // Check MIME type
    const detectedMimeType = fileType.mime;
    if (!options.allowedMimeTypes.includes(detectedMimeType)) {
      throw new BadRequestException(
        `File type ${detectedMimeType} is not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check extension if provided
    if (options.allowedExtensions) {
      const extension = this.getFileExtension(file.originalname);
      if (!options.allowedExtensions.includes(extension.toLowerCase())) {
        throw new BadRequestException(`File extension .${extension} is not allowed`);
      }
    }
  }

  /**
   * Validate image file (no file size limit)
   */
  async validateImage(file: any): Promise<void> {
    await this.validateFile(file, {
      maxSize: 0, // No size limit
      allowedMimeTypes: this.ALLOWED_IMAGE_TYPES,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    });
  }

  /**
   * Validate video file
   */
  async validateVideo(file: any): Promise<void> {
    await this.validateFile(file, {
      maxSize: this.MAX_VIDEO_SIZE,
      allowedMimeTypes: this.ALLOWED_VIDEO_TYPES,
    });
  }

  /**
   * Validate document file
   */
  async validateDocument(file: any): Promise<void> {
    await this.validateFile(file, {
      maxSize: this.MAX_DOCUMENT_SIZE,
      allowedMimeTypes: this.ALLOWED_DOCUMENT_TYPES,
    });
  }

  /**
   * Validate audio file
   */
  async validateAudio(file: any): Promise<void> {
    await this.validateFile(file, {
      maxSize: this.MAX_VIDEO_SIZE, // Use video size limit for audio
      allowedMimeTypes: this.ALLOWED_AUDIO_TYPES,
    });
  }

  /**
   * Process and optimize image
   */
  async processImage(file: any, options: ImageProcessingOptions = {}): Promise<ProcessedFile> {
    // SVG files should not be processed - return as-is to preserve vector format
    if (this.isSvgFile(file.buffer)) {
      return {
        buffer: file.buffer,
        mimeType: 'image/svg+xml',
        extension: 'svg',
        originalName: file.originalname,
        size: file.buffer.length,
      };
    }

    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'webp',
      fit = 'inside',
    } = options;

    try {
      let image = sharp(file.buffer);

      // Get image metadata
      const metadata = await image.metadata();

      // Resize if needed
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          image = image.resize(maxWidth, maxHeight, {
            fit,
            withoutEnlargement: true,
          });
        }
      }

      // Convert format and optimize
      let outputBuffer: Buffer;
      let outputMimeType: string;
      let outputExtension: string;

      switch (format) {
        case 'webp':
          outputBuffer = await image.webp({ quality }).toBuffer();
          outputMimeType = 'image/webp';
          outputExtension = 'webp';
          break;
        case 'jpeg':
          outputBuffer = await image.jpeg({ quality }).toBuffer();
          outputMimeType = 'image/jpeg';
          outputExtension = 'jpg';
          break;
        case 'png':
          outputBuffer = await image.png({ quality: Math.min(quality, 100) }).toBuffer();
          outputMimeType = 'image/png';
          outputExtension = 'png';
          break;
        default:
          outputBuffer = await image.webp({ quality }).toBuffer();
          outputMimeType = 'image/webp';
          outputExtension = 'webp';
      }

      return {
        buffer: outputBuffer,
        mimeType: outputMimeType,
        extension: outputExtension,
        originalName: file.originalname,
        size: outputBuffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to process image', error);
      throw new BadRequestException('Failed to process image file');
    }
  }

  /**
   * Process profile photo (resize to square, smaller size)
   */
  async processProfilePhoto(file: any): Promise<ProcessedFile> {
    return this.processImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 90,
      format: 'webp',
      fit: 'cover',
    });
  }

  /**
   * Upload processed file to storage
   */
  async uploadFile(processedFile: ProcessedFile, bucket: string, key: string): Promise<string> {
    try {
      // Sanitize originalName for S3 metadata (must be ASCII-safe)
      const safeOriginalName = this.sanitizeMetadataValue(processedFile.originalName);

      await this.storageService.uploadFile({
        bucket,
        key,
        body: processedFile.buffer,
        contentType: processedFile.mimeType,
        metadata: {
          originalName: safeOriginalName,
          processed: 'true',
        },
        acl: 'public-read',
      });

      const url = this.storageService.generatePublicUrl(bucket, key);

      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file to storage: ${key}`, error);
      throw new BadRequestException('Failed to upload file to storage');
    }
  }

  /**
   * Generate storage key for tile background image
   */
  generateTileBackgroundKey(tileId: string, extension: string): string {
    return `tiles/${tileId}/background.${extension}`;
  }

  /**
   * Generate storage key for tile icon image
   */
  generateTileIconKey(tileId: string, extension: string): string {
    return `tiles/${tileId}/icon.${extension}`;
  }

  /**
   * Generate storage key for city header image
   */
  generateCityHeaderKey(cityId: string, extension: string): string {
    return `cities/${cityId}/header.${extension}`;
  }

  /**
   * Generate storage key for listing hero image
   */
  generateListingHeroKey(listingId: string, extension: string): string {
    return `listings/${listingId}/hero.${extension}`;
  }

  /**
   * Generate storage key for listing media file
   */
  generateListingMediaKey(listingId: string, index: number, extension: string): string {
    const timestamp = Date.now();
    return `listings/${listingId}/media/${timestamp}-${index}.${extension}`;
  }

  /**
   * Generate storage key for user profile photo
   */
  generateUserProfilePhotoKey(userId: string, extension: string): string {
    return `users/${userId}/profile-photo.${extension}`;
  }

  /**
   * Generate storage key for category image
   */
  generateCategoryImageKey(categoryId: string, extension: string): string {
    return `categories/${categoryId}/image.${extension}`;
  }

  /**
   * Generate storage key for category icon
   */
  generateCategoryIconKey(categoryId: string, extension: string): string {
    return `categories/${categoryId}/icon.${extension}`;
  }

  /**
   * Generate storage key for category asset image (used for seeding)
   * Returns: categories/{categoryId}/image.{extension}
   */
  generateCategoryAssetKey(categoryId: string, extension: string): string {
    return `categories/${categoryId}/image.${extension}`;
  }

  /**
   * Generate storage key for city category image
   */
  generateCityCategoryImageKey(cityId: string, categoryId: string, extension: string): string {
    return `city-categories/${cityId}/${categoryId}/image.${extension}`;
  }

  /**
   * Generate storage key for city category icon
   */
  generateCityCategoryIconKey(cityId: string, categoryId: string, extension: string): string {
    return `city-categories/${cityId}/${categoryId}/icon.${extension}`;
  }

  /**
   * Generate storage key for city header asset image (used for seeding)
   * Returns: cities/{cityId}/header.{extension}
   */
  generateCityHeaderAssetKey(cityId: string, extension: string): string {
    return `cities/${cityId}/header.${extension}`;
  }

  /**
   * Generate storage key for city dark logo image
   */
  generateCityDarkLogoKey(cityId: string, extension: string): string {
    return `cities/${cityId}/dark-logo.${extension}`;
  }

  /**
   * Generate storage key for city light logo image
   */
  generateCityLightLogoKey(cityId: string, extension: string): string {
    return `cities/${cityId}/light-logo.${extension}`;
  }

  /**
   * Check if a buffer contains an SVG file
   * SVGs are XML-based and may not be detected by file-type library
   */
  private isSvgFile(buffer: Buffer): boolean {
    try {
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
      // Check for SVG markers - either starts with XML declaration or <svg tag
      const trimmedContent = content.trim();
      return (
        trimmedContent.startsWith('<?xml') ||
        trimmedContent.startsWith('<svg') ||
        trimmedContent.includes('<svg')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Sanitize a string for use in S3 metadata (must be US-ASCII)
   * URL encodes non-ASCII characters to make them safe for S3 metadata
   */
  private sanitizeMetadataValue(value: string): string {
    return encodeURIComponent(value);
  }

  /**
   * Detect media type from file
   */
  async detectMediaType(file: any): Promise<{
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';
    mimeType: string;
  }> {
    const fileType = await fromBuffer(file.buffer);

    // Special handling for SVG files (text-based, file-type may not detect them)
    if (!fileType) {
      if (this.isSvgFile(file.buffer)) {
        return { type: 'IMAGE', mimeType: 'image/svg+xml' };
      }
      return { type: 'OTHER', mimeType: file.mimetype };
    }

    const mimeType = fileType.mime;

    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return { type: 'IMAGE', mimeType };
    }
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return { type: 'VIDEO', mimeType };
    }
    if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      return { type: 'DOCUMENT', mimeType };
    }
    if (this.ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return { type: 'AUDIO', mimeType };
    }

    return { type: 'OTHER', mimeType };
  }
}
