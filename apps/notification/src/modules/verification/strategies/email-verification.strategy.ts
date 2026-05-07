import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import { IVerificationStrategy } from './verification-strategy.interface';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { I18nService } from '@kodi/i18n';
import { CityEmailThemeService } from '../services/city-email-theme.service';
import { CityEmailTheme } from '../config/default-email-theme.config';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationStrategy implements IVerificationStrategy {
  private readonly baseUrl: string;

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly i18nService: I18nService,
    private readonly cityEmailThemeService: CityEmailThemeService,
  ) {
    // Use API gateway URL if configured, otherwise fallback to direct service URL
    const apiGatewayBaseUrl = this.configService.get<string>('apiGatewayBaseUrl');
    const apiPrefix = this.configService.get<string>('apiPrefix', 'api');

    if (apiGatewayBaseUrl) {
      // Use API gateway URL with /api/notification prefix
      this.baseUrl = `${apiGatewayBaseUrl}/${apiPrefix}/notification`;
    } else {
      // Fallback to direct service URL for local development
      const notificationPort = this.configService.get<number>('notification.port', 3005);
      const host = process.env.NOTIFICATION_HOST || 'localhost';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      this.baseUrl = `${protocol}://${host}:${notificationPort}`;
    }
    this.logger.setContext(EmailVerificationStrategy.name);
  }

  generateToken(): string {
    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    return crypto.randomBytes(32).toString('hex');
  }

  validateIdentifier(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  async sendVerification(
    identifier: string,
    token: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const verificationLink = `${this.baseUrl}/verification/verify?token=${token}`;
    const cancelLink = `${this.baseUrl}/verification/cancel?token=${token}`;

    const preferredLanguage =
      metadata?.preferredLanguage || metadata?.language || metadata?.locale || undefined;

    // Get city theme configuration
    const cityId = metadata?.cityId || null;
    const cityTheme = await this.cityEmailThemeService.getCityTheme(cityId);

    // Generate greeting from translation using city's greetingKey
    const appName = cityTheme.appName || 'Kodi';
    const firstNamePart = metadata?.firstName ? `, ${metadata.firstName}` : '';

    // Build greeting key based on city theme (e.g., 'kodi' -> 'greetingKodi')
    let greetingTemplate: string;
    if (cityTheme.greetingKey) {
      const cityGreetingKey = `emails.verification.greeting${cityTheme.greetingKey.charAt(0).toUpperCase()}${cityTheme.greetingKey.slice(1)}`;
      greetingTemplate = this.i18nService.translate(cityGreetingKey, undefined, preferredLanguage);
      // If translation not found (returns the key), fall back to default greeting
      if (greetingTemplate === cityGreetingKey) {
        greetingTemplate = this.i18nService.translate(
          'emails.verification.greeting',
          undefined,
          preferredLanguage,
        );
      }
    } else {
      greetingTemplate = this.i18nService.translate(
        'emails.verification.greeting',
        undefined,
        preferredLanguage,
      );
    }

    const greeting = greetingTemplate
      .replace('{appName}', appName)
      .replace('{firstNamePart}', firstNamePart);

    // Get subject with app name
    const subjectTemplate = this.i18nService.translate(
      'emails.verification.subject',
      undefined,
      preferredLanguage,
    );
    const emailSubject = subjectTemplate.replace('{appName}', appName);

    const emailContent = this.generateEmailContent(
      verificationLink,
      cancelLink,
      metadata?.firstName,
      emailSubject,
      preferredLanguage,
      cityTheme,
      greeting,
    );

    // Send welcome email with verification link
    await this.client.emit(RabbitMQPatterns.NOTIFICATION_SEND, {
      userId,
      type: 'INFO',
      channel: 'EMAIL',
      subject: emailSubject,
      content: emailContent,
      metadata: {
        ...metadata,
        recipientEmail: identifier, // Add recipient email for email delivery
        verificationType: 'EMAIL_VERIFICATION',
        verificationToken: token,
        verificationLink,
        cancelLink,
        template: 'welcome-verification',
      },
    });

    this.logger.log(`Email verification sent to ${identifier} for user ${userId}`);
  }

  private generateEmailContent(
    verificationLink: string,
    cancelLink: string,
    _firstName: string | undefined,
    emailSubject: string,
    preferredLanguage: string | undefined,
    cityTheme: CityEmailTheme,
    greeting: string,
  ): string {
    const intro = this.i18nService.translate(
      'emails.verification.intro',
      undefined,
      preferredLanguage,
    );
    const ctaText = this.i18nService.translate(
      'emails.verification.cta',
      undefined,
      preferredLanguage,
    );
    const expiryNotice = this.i18nService.translate(
      'emails.verification.expiryNotice',
      undefined,
      preferredLanguage,
    );
    const cancelText = this.i18nService.translate(
      'emails.verification.cancelText',
      undefined,
      preferredLanguage,
    );
    const cancelLinkText = this.i18nService.translate(
      'emails.verification.cancelLinkText',
      undefined,
      preferredLanguage,
    );
    const fallback = this.i18nService.translate(
      'emails.verification.fallback',
      undefined,
      preferredLanguage,
    );

    // Use city theme colors or defaults
    const headerBackgroundColor =
      cityTheme.emailTheme?.headerBackgroundColor || cityTheme.secondaryColor || '#1a1a2e';
    const footerBackgroundColor =
      cityTheme.emailTheme?.footerBackgroundColor || cityTheme.primaryColor || '#009EE0';
    const buttonColor = cityTheme.emailTheme?.buttonColor || '#ffffff';
    const buttonTextColor =
      cityTheme.emailTheme?.buttonTextColor || cityTheme.primaryColor || '#009EE0';
    const accentColor = cityTheme.accentColor || '#009EE0';

    // Generate logo HTML from external URL if configured
    const logoUrl = cityTheme.logoUrl;
    const logoWidth = cityTheme.logoWidth || 180;
    const logoHeight = cityTheme.logoHeight || 31;
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${cityTheme.appName || 'mein.Kodi'}" width="${logoWidth}" height="${logoHeight}" style="display: block; border: 0; outline: none; max-width: 100%; margin-bottom: 20px;" />`
      : '';

    // Generate email template with city theme
    return `
      <!DOCTYPE html>
      <html lang="${preferredLanguage || 'en'}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${emailSubject}</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 0;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Upper section: Theme secondary color with logo and greeting -->
                <tr>
                  <td style="background-color: ${headerBackgroundColor}; padding: 40px 30px 60px 30px; text-align: left;">
                    <!-- Logo -->
                    ${logoHtml}
                    <!-- Greeting -->
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 32px; font-weight: bold; line-height: 1.2; font-family: Arial, Helvetica, sans-serif;">
                      ${greeting}
                    </h1>
                    <!-- Intro text -->
                    <p style="margin: 0 0 30px 0; color: #ffffff; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                      ${intro}
                    </p>
                  </td>
                </tr>
                <!-- Lower section: Theme primary color with CTA button -->
                <tr>
                  <td style="background-color: ${footerBackgroundColor}; padding: 40px 30px; text-align: center; position: relative;">
                    <!-- CTA Button -->
                    <div style="margin-bottom: 30px;">
                      <a href="${verificationLink}"
                         style="background-color: ${buttonColor}; color: ${buttonTextColor}; padding: 16px 40px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); border: 2px solid ${buttonColor};">
                        ${ctaText}
                      </a>
                    </div>
                    <!-- Expiry notice -->
                    <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 14px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                      ${expiryNotice}
                    </p>
                  </td>
                </tr>
                <!-- Footer section: Cancel link and fallback -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                      ${cancelText}
                      <a href="${cancelLink}" style="color: #e74c3c; text-decoration: underline;">${cancelLinkText}</a>.
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                      ${fallback}<br>
                      <a href="${verificationLink}" style="color: ${accentColor}; text-decoration: underline; word-break: break-all;">${verificationLink}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  getType(): 'EMAIL' {
    return 'EMAIL';
  }
}
