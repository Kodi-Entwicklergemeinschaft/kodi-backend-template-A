import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@kodi/redis';
import { SagaOrchestratorService } from './saga-orchestrator.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [SagaOrchestratorService],
  exports: [SagaOrchestratorService],
})
export class SagaModule {}
