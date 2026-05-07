import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';

@Injectable()
export class EmailService {
  private readonly logger: LoggerService;
  private readonly transporter: Transporter;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(EmailService.name);

    // Create nodemailer transporter
    // Start with minimal config (host and auth are required)
    const transportConfig: any = {
      host: configService.smtpHost,
      auth: {
        user: configService.smtpUser,
        pass: configService.smtpPassword,
      },
    };

    // Add optional path if configured (for custom SMTP servers that require a path)
    if (configService.smtpPath) {
      transportConfig.path = configService.smtpPath;
    }

    // Add optional port if configured
    const smtpPort = configService.smtpPort;
    if (smtpPort !== undefined) {
      transportConfig.port = smtpPort;
    }

    // Add optional secure flag if configured
    const smtpSecure = configService.smtpSecure;
    if (smtpSecure !== undefined) {
      transportConfig.secure = smtpSecure;
    }

    // Add optional TLS configuration if configured
    const tlsConfig = configService.get('smtp.tls');
    if (tlsConfig && tlsConfig.rejectUnauthorized !== undefined) {
      transportConfig.tls = {
        rejectUnauthorized: tlsConfig.rejectUnauthorized,
      };
    }

    // Add optional requireTLS if port is 587
    if (smtpPort === 587) {
      transportConfig.requireTLS = true;
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  /**
   * Send email with HTML content
   */
  async sendEmail(to: string, subject: string, htmlContent: string, from?: string): Promise<void> {
    const fromAddress = from || this.configService.smtpFrom;

    try {
      await this.transporter.sendMail({
        to,
        from: fromAddress,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmailWithRetry(
    to: string,
    subject: string,
    htmlContent: string,
    from?: string,
    retries = this.maxRetries,
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.sendEmail(to, subject, htmlContent, from);
        return; // Success, exit
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Email send attempt ${attempt}/${retries} failed for ${to}`, error);

        // If not the last attempt, wait before retrying
        if (attempt < retries) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All retries failed
    const errorMessage = lastError || new Error('Unknown error occurred');
    this.logger.error(`Failed to send email to ${to} after ${retries} attempts`, errorMessage);
    throw errorMessage;
  }

  /**
   * Send verification email (wrapper for consistency)
   */
  async sendVerificationEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    return this.sendEmailWithRetry(to, subject, htmlContent);
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
