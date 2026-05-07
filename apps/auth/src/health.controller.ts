import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { PrismaAuthService } from '@kodi/prisma';
import { RedisService } from '@kodi/redis';
import { Public } from '@kodi/jwt';

@Controller('healthz')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaAuthService,
    private redis: RedisService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => ({
        database: {
          status: (await this.prisma.healthCheck()) ? 'up' : 'down',
        },
      }),
      async () => ({
        redis: {
          status: (await this.redis.healthCheck()) ? 'up' : 'down',
        },
      }),
    ]);
  }
}
