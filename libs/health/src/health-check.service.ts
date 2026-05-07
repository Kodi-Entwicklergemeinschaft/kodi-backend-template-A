import { Injectable, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import { PrismaClient } from '@prisma/client';
import { RedisService } from '@kodi/redis';
import { LoggerService, ChildLogger } from '@kodi/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    queue: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  metrics: {
    totalJobs: number;
    activeJobs: number;
    failedJobs: number;
    queueHealth: string;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  lastChecked: string;
  details?: Record<string, any>;
}

@Injectable()
export class HealthCheckService {
  private readonly structuredLogger: ChildLogger;
  private readonly startTime = Date.now();
  private readonly queueService?: any;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject('PRISMA_SERVICE') private readonly prismaService?: PrismaClient,
    private readonly redisService: RedisService,
    loggerService: LoggerService,
  ) {
    this.structuredLogger = loggerService.createChildLogger({
      operation: 'health-check',
    });
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    try {
      const [databaseCheck, redisCheck, queueCheck, memoryCheck, diskCheck, metrics] =
        await Promise.allSettled([
          this.checkDatabase(),
          this.checkRedis(),
          this.checkQueue(),
          this.checkMemory(),
          this.checkDisk(),
          this.getMetrics(),
        ]);

      const checks = {
        database: this.getCheckResult(databaseCheck),
        redis: this.getCheckResult(redisCheck),
        queue: this.getCheckResult(queueCheck),
        memory: this.getCheckResult(memoryCheck),
        disk: this.getCheckResult(diskCheck),
      };

      const overallStatus = this.calculateOverallStatus(checks);
      const metricsResult = this.getMetricsResult(metrics);

      return {
        status: overallStatus,
        timestamp,
        uptime,
        version: this.configService.get<string>('serviceVersion', '1.0.0'),
        environment: this.configService.get<string>('nodeEnv', 'development'),
        checks,
        metrics: metricsResult,
      };
    } catch (error) {
      this.structuredLogger.error('Failed to perform health check', error);
      return this.getUnhealthyStatus(timestamp, uptime, error);
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    if (!this.prismaService) {
      return {
        status: 'degraded',
        message: 'Database service not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        message: `Database connection successful (${responseTime}ms)`,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error?.message || String(error)}`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { error: error?.message || String(error) },
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const client = this.redisService.getClient();
      await client.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        message: `Redis connection successful (${responseTime}ms)`,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Redis connection failed: ${error?.message || String(error)}`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { error: error?.message || String(error) },
      };
    }
  }

  private async checkQueue(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (!this.queueService?.getQueueStats) {
        return {
          status: 'degraded',
          message: 'Queue service not configured',
          lastChecked: new Date().toISOString(),
        };
      }

      const stats = await this.queueService.getQueueStats();
      const responseTime = Date.now() - startTime;

      const totalJobs =
        stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed;
      const failureRate = totalJobs > 0 ? stats.failed / totalJobs : 0;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Queue operational (${responseTime}ms)`;

      if (failureRate > 0.5) {
        status = 'unhealthy';
        message = `High failure rate: ${(failureRate * 100).toFixed(1)}%`;
      } else if (failureRate > 0.2 || responseTime > 2000) {
        status = 'degraded';
        message = `Queue degraded - failure rate: ${(failureRate * 100).toFixed(1)}%`;
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { stats, failureRate },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Queue check failed: ${error?.message || String(error)}`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { error: error?.message || String(error) },
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryUtilization = usedMemory / totalMemory;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Memory usage: ${(memoryUtilization * 100).toFixed(1)}%`;

      if (memoryUtilization > 0.9) {
        status = 'unhealthy';
        message = `Critical memory usage: ${(memoryUtilization * 100).toFixed(1)}%`;
      } else if (memoryUtilization > 0.8) {
        status = 'degraded';
        message = `High memory usage: ${(memoryUtilization * 100).toFixed(1)}%`;
      }

      return {
        status,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          memoryUsage,
          utilizationPercent: memoryUtilization * 100,
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error?.message || String(error)}`,
        lastChecked: new Date().toISOString(),
        details: { error: error?.message || String(error) },
      };
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    try {
      // Simple disk check - in production you might want to use a more sophisticated approach
      const stats = await import('fs').then((fs) => fs.promises.stat('.'));

      return {
        status: 'healthy',
        message: 'Disk accessible',
        lastChecked: new Date().toISOString(),
        details: {
          accessible: true,
          lastModified: stats.mtime,
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Disk check failed: ${error?.message || String(error)}`,
        lastChecked: new Date().toISOString(),
        details: { error: error?.message || String(error) },
      };
    }
  }

  private async getMetrics() {
    try {
      if (!this.queueService?.getQueueStats) {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000;
        return {
          totalJobs: 0,
          activeJobs: 0,
          failedJobs: 0,
          queueHealth: 'unknown',
          memoryUsage,
          cpuUsage: cpuPercent,
        };
      }

      const [queueStats, jobCount] = await Promise.all([
        this.queueService.getQueueStats(),
        this.getJobCount(),
      ]);

      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

      return {
        totalJobs: jobCount.total,
        activeJobs: queueStats.active,
        failedJobs: queueStats.failed,
        queueHealth: this.getQueueHealthStatus(queueStats),
        memoryUsage,
        cpuUsage: cpuPercent,
      };
    } catch (error) {
      this.structuredLogger.error('Failed to get metrics', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        failedJobs: 0,
        queueHealth: 'unknown',
        memoryUsage: process.memoryUsage(),
        cpuUsage: 0,
      };
    }
  }

  private async getJobCount(): Promise<{ total: number; active: number; failed: number }> {
    // Job model not available in current schema
    // This can be implemented when a job/schedule model is available
    return { total: 0, active: 0, failed: 0 };
  }

  private getQueueHealthStatus(stats: any): string {
    const totalJobs = stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed;
    if (totalJobs === 0) return 'idle';

    const failureRate = stats.failed / totalJobs;
    if (failureRate > 0.5) return 'critical';
    if (failureRate > 0.2) return 'warning';
    if (stats.active > 0 || stats.waiting > 0) return 'active';
    return 'idle';
  }

  private getCheckResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        message: `Check failed: ${result.reason?.message || 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
        details: { error: result.reason?.message },
      };
    }
  }

  private getMetricsResult(result: PromiseSettledResult<any>): any {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        totalJobs: 0,
        activeJobs: 0,
        failedJobs: 0,
        queueHealth: 'unknown',
        memoryUsage: process.memoryUsage(),
        cpuUsage: 0,
      };
    }
  }

  private calculateOverallStatus(
    checks: Record<string, HealthCheck>,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map((check) => check.status);

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private getUnhealthyStatus(timestamp: string, uptime: number, _error: any): HealthStatus {
    return {
      status: 'unhealthy',
      timestamp,
      uptime,
      version: this.configService.get<string>('serviceVersion', '1.0.0'),
      environment: this.configService.get<string>('nodeEnv', 'development'),
      checks: {
        database: {
          status: 'unhealthy',
          message: 'Health check failed',
          lastChecked: timestamp,
        },
        redis: {
          status: 'unhealthy',
          message: 'Health check failed',
          lastChecked: timestamp,
        },
        queue: {
          status: 'unhealthy',
          message: 'Health check failed',
          lastChecked: timestamp,
        },
        memory: {
          status: 'unhealthy',
          message: 'Health check failed',
          lastChecked: timestamp,
        },
        disk: {
          status: 'unhealthy',
          message: 'Health check failed',
          lastChecked: timestamp,
        },
      },
      metrics: {
        totalJobs: 0,
        activeJobs: 0,
        failedJobs: 0,
        queueHealth: 'unknown',
        memoryUsage: process.memoryUsage(),
        cpuUsage: 0,
      },
    };
  }
}
