import { Injectable } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import { LoggerService, ChildLogger } from '@kodi/logger';
import { Alert, AlertChannel } from './interfaces';

@Injectable()
export class AlertingService {
  private readonly channels: AlertChannel[] = [];
  private readonly structuredLogger: ChildLogger;

  constructor(
    private readonly configService: ConfigService,
    loggerService: LoggerService,
  ) {
    this.structuredLogger = loggerService.createChildLogger({
      operation: 'alerting',
    });

    this.initializeChannels();
  }

  private initializeChannels(): void {
    // Initialize console channel (always enabled for development)
    this.channels.push({
      type: 'console',
      config: {},
      enabled: true,
    });

    // Initialize webhook channel if configured
    const webhookUrl = this.configService.get<string>('ALERT_WEBHOOK_URL');
    if (webhookUrl) {
      this.channels.push({
        type: 'webhook',
        config: { url: webhookUrl },
        enabled: true,
      });
    }

    // Initialize email channel if configured
    const emailConfig = {
      smtpHost: this.configService.get<string>('ALERT_SMTP_HOST'),
      smtpPort: this.configService.get<number>('ALERT_SMTP_PORT'),
      smtpUser: this.configService.get<string>('ALERT_SMTP_USER'),
      smtpPass: this.configService.get<string>('ALERT_SMTP_PASS'),
      fromEmail: this.configService.get<string>('ALERT_FROM_EMAIL'),
      toEmails: this.configService.get<string>('ALERT_TO_EMAILS')?.split(',') || [],
    };

    if (emailConfig.smtpHost && emailConfig.toEmails.length > 0) {
      this.channels.push({
        type: 'email',
        config: emailConfig,
        enabled: true,
      });
    }

    this.structuredLogger.log(`Initialized ${this.channels.length} alert channels`);
  }

  /**
   * Send alert notification through all enabled channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    const enabledChannels = this.channels.filter((channel) => channel.enabled);

    if (enabledChannels.length === 0) {
      this.structuredLogger.warn('No alert channels enabled, alert not sent', {
        alertId: alert.id,
        ruleId: alert.ruleId,
      });
      return;
    }

    const promises = enabledChannels.map((channel) =>
      this.sendToChannel(channel, alert).catch((error) => {
        this.structuredLogger.error(`Failed to send alert to ${channel.type}`, error);
      }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'console':
        await this.sendToConsole(alert);
        break;
      case 'webhook':
        await this.sendToWebhook(channel.config, alert);
        break;
      case 'email':
        await this.sendToEmail(channel.config, alert);
        break;
      case 'slack':
        await this.sendToSlack(channel.config, alert);
        break;
      default:
        this.structuredLogger.warn(`Unknown alert channel type: ${channel.type}`);
    }
  }

  /**
   * Send alert to console (logging)
   */
  private async sendToConsole(alert: Alert): Promise<void> {
    const logLevel = this.getLogLevel(alert.severity);
    const message = `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`;

    this.structuredLogger[logLevel](message);
  }

  /**
   * Send alert to webhook
   */
  private async sendToWebhook(config: any, alert: Alert): Promise<void> {
    try {
      const payload = {
        alert: {
          id: alert.id,
          ruleId: alert.ruleId,
          ruleName: alert.ruleName,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
        },
        service: this.configService.get<string>('serviceName', 'MonitoringService'),
        environment: this.configService.get<string>('nodeEnv', 'development'),
      };

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      this.structuredLogger.log('Alert sent to webhook successfully');
    } catch (error) {
      this.structuredLogger.error('Failed to send alert to webhook', error);
      throw error;
    }
  }

  /**
   * Send alert to email
   */
  private async sendToEmail(_config: any, _alert: Alert): Promise<void> {
    // This is a placeholder implementation
    // In a real application, you would use a library like nodemailer
    this.structuredLogger.log('Email alert would be sent here');
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(_config: any, _alert: Alert): Promise<void> {
    // This is a placeholder implementation
    // In a real application, you would use Slack's webhook API
    this.structuredLogger.log('Slack alert would be sent here');
  }

  /**
   * Get appropriate log level for alert severity
   */
  private getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
      case 'medium':
        return 'warn';
      case 'low':
      default:
        return 'log';
    }
  }

  /**
   * Test alert channels
   */
  async testChannels(): Promise<{ channel: string; success: boolean; error?: string }[]> {
    const testAlert: Alert = {
      id: 'test_alert_' + Date.now(),
      ruleId: 'test_rule',
      ruleName: 'Test Alert',
      severity: 'low',
      message: 'This is a test alert to verify channel configuration',
      timestamp: new Date(),
      resolved: false,
    };

    const results: { channel: string; success: boolean; error?: string }[] = [];

    for (const channel of this.channels.filter((c) => c.enabled)) {
      try {
        await this.sendToChannel(channel, testAlert);
        results.push({ channel: channel.type, success: true });
      } catch (error) {
        results.push({
          channel: channel.type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get channel configuration
   */
  getChannels(): AlertChannel[] {
    return this.channels.map((channel) => ({
      ...channel,
      config:
        channel.type === 'email'
          ? { ...channel.config, smtpPass: '***' } // Hide sensitive data
          : channel.config,
    }));
  }

  /**
   * Update channel configuration
   */
  updateChannel(type: string, updates: Partial<AlertChannel>): boolean {
    const channelIndex = this.channels.findIndex((c) => c.type === type);
    if (channelIndex === -1) {
      return false;
    }

    this.channels[channelIndex] = { ...this.channels[channelIndex], ...updates };
    this.structuredLogger.log(`Updated alert channel: ${type}`);
    return true;
  }
}
