import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaNotificationService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

@Injectable()
export class FirebaseProjectManager implements OnModuleInit {
  private readonly logger: LoggerService;
  private readonly appCache = new Map<string, admin.app.App>();
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaNotificationService,
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(FirebaseProjectManager.name);
    // Get encryption key from config/env
    this.encryptionKey =
      process.env.FCM_ENCRYPTION_KEY ||
      this.configService.get<string>('fcm.encryptionKey') ||
      'default-key-change-in-production';
  }

  async onModuleInit() {
    // Load all active projects into cache
    await this.loadProjects();
  }

  /**
   * Get Firebase app instance for a city
   * Falls back to default project if city doesn't have one
   */
  async getFirebaseApp(cityId?: string): Promise<admin.app.App> {
    // If cityId provided, try to get city-specific project
    if (cityId) {
      const project = await this.prisma.firebaseProject.findUnique({
        where: { cityId },
      });

      if (project && project.isActive) {
        return this.getOrCreateApp(project);
      }
    }

    // Fall back to default project
    const defaultProject = await this.prisma.firebaseProject.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultProject) {
      throw new Error('No default Firebase project configured');
    }

    return this.getOrCreateApp(defaultProject);
  }

  /**
   * Get or create Firebase app instance from cache
   */
  private getOrCreateApp(project: any): admin.app.App {
    const cacheKey = project.id;

    if (this.appCache.has(cacheKey)) {
      return this.appCache.get(cacheKey)!;
    }

    // Decrypt credentials
    const credentials = this.decrypt(project.credentials);

    // Initialize Firebase app
    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(credentials),
        projectId: project.projectId,
      },
      cacheKey, // Use project ID as app name
    );

    this.appCache.set(cacheKey, app);
    this.logger.log(`Initialized Firebase app for project: ${project.projectName}`);

    return app;
  }

  /**
   * Load all active projects into cache
   */
  private async loadProjects(): Promise<void> {
    const projects = await this.prisma.firebaseProject.findMany({
      where: { isActive: true },
    });

    for (const project of projects) {
      try {
        this.getOrCreateApp(project);
      } catch (error) {
        this.logger.error(`Failed to load Firebase project: ${project.id}`, error);
      }
    }
  }

  /**
   * Encrypt Firebase credentials before storing
   */
  encrypt(credentials: any): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt Firebase credentials
   *
   * Supports both:
   * - Encrypted objects stored as JSON (preferred)
   * - Encrypted payloads stored as JSON strings (as used by seed scripts)
   * - Legacy plain credentials objects (returned as-is)
   */
  private decrypt(encryptedData: string | any): any {
    let payload: any = encryptedData;

    // If stored as a JSON string, try to parse it first
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        // If parsed object looks like our encrypted payload, use it
        if (parsed && typeof parsed === 'object' && 'encrypted' in parsed) {
          payload = parsed;
        } else {
          // Parsed to a normal object (likely legacy plain credentials)
          return parsed;
        }
      } catch {
        // Not JSON – treat as legacy/unencrypted and return as-is
        return payload;
      }
    }

    // Encrypted object case
    if (typeof payload === 'object' && payload.encrypted) {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(payload.iv, 'hex'));

      decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

      let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    }

    // Legacy: if not encrypted, return as-is (for migration)
    return payload;
  }

  /**
   * Clear app cache (useful for testing or when credentials are updated)
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      const app = this.appCache.get(projectId);
      if (app) {
        app.delete();
        this.appCache.delete(projectId);
      }
    } else {
      // Clear all
      for (const [, app] of this.appCache.entries()) {
        app.delete();
      }
      this.appCache.clear();
    }
  }
}
