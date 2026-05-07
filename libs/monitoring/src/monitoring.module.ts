import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@kodi/config';
import { LoggerModule } from '@kodi/logger';
import { HealthModule } from '@kodi/health';
import { ErrorHandlingModule } from '@kodi/errors';
import {
  PrismaAuthModule,
  PrismaUsersModule,
  PrismaCityModule,
  PrismaCoreModule,
  PrismaNotificationModule,
  PrismaSchedulerModule,
} from '@kodi/prisma';
import { MonitoringService } from './monitoring.service';
import { AlertingService } from './alerting.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    HealthModule,
    ErrorHandlingModule,
    // Import all Prisma modules - they are @Global() so will be available across the app
    // Services that don't exist in a microservice will gracefully fail with @Optional()
    PrismaAuthModule,
    PrismaUsersModule,
    PrismaCityModule,
    PrismaCoreModule,
    PrismaNotificationModule,
    PrismaSchedulerModule,
  ],
  providers: [MonitoringService, AlertingService],
  exports: [MonitoringService, AlertingService],
})
export class MonitoringModule {}
