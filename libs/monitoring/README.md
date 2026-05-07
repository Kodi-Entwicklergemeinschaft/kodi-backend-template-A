# @kodi/monitoring

Comprehensive monitoring and alerting library for KODI microservices.

## Features

- **System Metrics Collection**: Monitor CPU, memory, database, and queue performance
- **Job Metrics**: Track job execution, success rates, and failure rates
- **Alert System**: Configurable alert rules with multiple notification channels
- **Alert Channels**: Console, webhook, email, and Slack support
- **Metrics History**: Keep track of historical metrics for trend analysis

## Installation

This library is already part of the KODI monorepo. To use it in your microservice:

```typescript
import { MonitoringModule } from '@kodi/monitoring';

@Module({
  imports: [
    MonitoringModule,
    // ... other imports
  ],
})
export class AppModule {}
```

## Usage

### Basic Monitoring

```typescript
import { MonitoringService } from '@kodi/monitoring';

@Injectable()
export class MyService {
  constructor(private readonly monitoringService: MonitoringService) {}

  async getMetrics() {
    const metrics = await this.monitoringService.getMetrics();
    console.log(metrics);
  }
}
```

### Alert Configuration

The monitoring service comes with pre-configured alert rules:

- **High Failure Rate**: Triggers when job failure rate exceeds 20%
- **Queue Stalled**: Triggers when no jobs are processed for 30 minutes
- **High Memory Usage**: Triggers when memory usage exceeds 85%
- **Database Connection Issues**: Triggers on database health check failures
- **Redis Connection Issues**: Triggers on Redis health check failures
- **High Error Rate**: Triggers when error rate exceeds 10 errors/minute

### Customizing Alert Rules

```typescript
// Update an existing alert rule
monitoringService.updateAlertRule('high_failure_rate', {
  threshold: 0.3, // 30%
  enabled: true,
});

// Get all alert rules
const rules = monitoringService.getAlertRules();
```

### Alert Channels

Configure alert channels via environment variables:

```bash
# Webhook
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts

# Email
ALERT_SMTP_HOST=smtp.gmail.com
ALERT_SMTP_PORT=587
ALERT_SMTP_USER=alerts@example.com
ALERT_SMTP_PASS=your-password
ALERT_FROM_EMAIL=alerts@example.com
ALERT_TO_EMAILS=admin1@example.com,admin2@example.com
```

### Testing Alerts

```typescript
import { AlertingService } from '@kodi/monitoring';

@Injectable()
export class TestService {
  constructor(private readonly alertingService: AlertingService) {}

  async testAlerts() {
    const results = await this.alertingService.testChannels();
    console.log(results);
  }
}
```

## API Reference

### MonitoringService

#### Methods

- `collectMetrics()`: Collect current system metrics
- `getMetrics()`: Get current system metrics
- `getMetricsHistory(limit?: number)`: Get historical metrics
- `getActiveAlerts()`: Get all active unresolved alerts
- `getAlertHistory(limit?: number)`: Get alert history
- `resolveAlert(alertId: string)`: Manually resolve an alert
- `getAlertRules()`: Get all configured alert rules
- `updateAlertRule(ruleId: string, updates: Partial<AlertRule>)`: Update an alert rule

### AlertingService

#### Methods

- `sendAlert(alert: Alert)`: Send alert through all enabled channels
- `testChannels()`: Test all configured alert channels
- `getChannels()`: Get all configured channels
- `updateChannel(type: string, updates: Partial<AlertChannel>)`: Update channel configuration

## Interfaces

### SystemMetrics

```typescript
interface SystemMetrics {
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  jobs: JobMetrics;
  queues: { scraping: QueueMetrics; cleanup: QueueMetrics };
  system: SystemResourceMetrics;
  database: DatabaseMetrics;
  errors: ErrorMetrics;
}
```

### Alert

```typescript
interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}
```

## Dependencies

This library depends on:

- `@kodi/logger`: For structured logging [[memory:6447008]]
- `@kodi/config`: For configuration management
- `@kodi/prisma`: For database metrics (optional)
- `@nestjs/schedule`: For scheduled alert checks

### Optional Dependencies

Some features require additional services:

- **QueueService**: For queue metrics (not yet implemented)
- **HealthCheckService**: For health status checks (not yet implemented)
- **ErrorReportingService**: For error metrics (not yet implemented)

If these services are not available, the monitoring service will continue to work with reduced functionality.

## Scheduled Tasks

The monitoring service runs automatic alert checks every minute via the `@Cron` decorator. Ensure `@nestjs/schedule` is properly configured in your application.

## Notes

- All services are marked as `@Optional()` where appropriate to prevent initialization errors
- The console alert channel is always enabled for development
- Webhook, email, and Slack channels must be configured via environment variables
- Alert cooldown periods prevent alert spam

## Example: Complete Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringModule } from '@kodi/monitoring';
import { ConfigModule } from '@kodi/config';
import { LoggerModule } from '@kodi/logger';

@Module({
  imports: [ConfigModule, LoggerModule, ScheduleModule.forRoot(), MonitoringModule],
})
export class AppModule {}
```

```typescript
// monitoring.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MonitoringService, AlertingService } from '@kodi/monitoring';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly alertingService: AlertingService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return await this.monitoringService.getMetrics();
  }

  @Get('metrics/history')
  getMetricsHistory() {
    return this.monitoringService.getMetricsHistory(50);
  }

  @Get('alerts')
  getActiveAlerts() {
    return this.monitoringService.getActiveAlerts();
  }

  @Get('alerts/rules')
  getAlertRules() {
    return this.monitoringService.getAlertRules();
  }

  @Get('alerts/test')
  async testAlerts() {
    return await this.alertingService.testChannels();
  }
}
```

## License

MIT
