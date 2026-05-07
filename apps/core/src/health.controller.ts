import { Controller, Get } from '@nestjs/common';
import { RedisService } from '@kodi/redis';

@Controller('healthz')
export class HealthController {
  constructor(private redis: RedisService) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      redis: (await this.redis.healthCheck()) ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
