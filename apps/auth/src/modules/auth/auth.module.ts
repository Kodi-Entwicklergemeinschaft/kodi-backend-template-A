import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthModule } from '@kodi/prisma';
import { RBACModule } from '@kodi/rbac';
import { SagaModule } from '@kodi/saga';

@Module({
  imports: [
    PrismaAuthModule, // For sessions and audit logs (own database)
    RBACModule,
    SagaModule, // Saga orchestrator for distributed transactions
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
