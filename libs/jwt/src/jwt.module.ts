import { DynamicModule, Global, Module, forwardRef } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtTokenService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule, ConfigService } from '@kodi/config';
import { PrismaCoreModule } from '@kodi/prisma';
import { RBACModule } from '@kodi/rbac';

@Global()
@Module({})
export class JwtModule {
  static register(): DynamicModule {
    return {
      module: JwtModule,
      imports: [
        ConfigModule,
        LoggerModule,
        PrismaCoreModule,
        forwardRef(() => RBACModule),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        NestJwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.jwtSecret,
            signOptions: {
              expiresIn: configService.jwtExpiresIn as any,
            },
          }),
        }),
      ],
      providers: [JwtTokenService, JwtStrategy, JwtAuthGuard],
      exports: [JwtTokenService, JwtAuthGuard, PassportModule, NestJwtModule],
    };
  }
}
