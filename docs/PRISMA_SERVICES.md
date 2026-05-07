# Prisma Services - Dependency Injection Guide

This guide explains how to use Prisma services in your NestJS microservices and shared libraries.

## Overview

Each microservice has its own dedicated Prisma service that connects to its specific database. All Prisma services are:

- Injectable via NestJS dependency injection
- Global modules (available across the entire application)
- Auto-connected on module initialization
- Auto-disconnected on module destruction

## Available Prisma Services

| Service                     | Module                     | Description                        |
| --------------------------- | -------------------------- | ---------------------------------- |
| `PrismaAuthService`         | `PrismaAuthModule`         | Auth microservice database         |
| `PrismaUsersService`        | `PrismaUsersModule`        | Users microservice database        |
| `PrismaCityService`         | `PrismaCityModule`         | City microservice database         |
| `PrismaCoreService`         | `PrismaCoreModule`         | Core microservice database         |
| `PrismaNotificationService` | `PrismaNotificationModule` | Notification microservice database |
| `PrismaSchedulerService`    | `PrismaSchedulerModule`    | Scheduler microservice database    |
| `PrismaIntegrationService`  | `PrismaIntegrationModule`  | Integration microservice database  |
| `PrismaAdminService`        | `PrismaAdminModule`        | Admin microservice database        |

## Usage in Microservices

### 1. Import Your Own Prisma Module

Each microservice should import its own Prisma module in `app.module.ts`:

```typescript
// apps/auth/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaAuthModule } from '@kodi/prisma-auth'; // or '@kodi/prisma'
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    PrismaAuthModule, // Import your microservice's Prisma module
    AuthModule,
  ],
})
export class AppModule {}
```

### 2. Inject in Your Service

Inject the Prisma service using constructor injection:

```typescript
// apps/auth/src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaAuthService } from '@kodi/prisma-auth'; // or '@kodi/prisma'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaAuthService, // Inject your microservice's Prisma service
  ) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
```

### 3. Using Multiple Prisma Services (Cross-Service Access)

If a microservice needs to access another microservice's database, you can import multiple Prisma modules:

```typescript
// apps/core/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaCoreModule } from '@kodi/prisma-core';
import { PrismaUsersModule } from '@kodi/prisma-users'; // Access users DB
import { CoreModule } from './modules/core/core.module';

@Module({
  imports: [
    PrismaCoreModule, // Your own database
    PrismaUsersModule, // Access to users database
    CoreModule,
  ],
})
export class AppModule {}
```

Then inject multiple services:

```typescript
// apps/core/src/modules/core/core.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma-core';
import { PrismaUsersService } from '@kodi/prisma-users';

@Injectable()
export class CoreService {
  constructor(
    private readonly prismaCore: PrismaCoreService, // Your own database
    private readonly prismaUsers: PrismaUsersService, // Access users database
  ) {}

  async getCoreDataWithUser(userId: string) {
    // Query your own database
    const coreData = await this.prismaCore.data.findMany();

    // Query another microservice's database
    const user = await this.prismaUsers.user.findUnique({
      where: { id: userId },
    });

    return { coreData, user };
  }
}
```

## Usage in Shared Libraries

### Monitoring Service Example

The monitoring library can access all microservice databases by importing all Prisma modules and using optional injection:

```typescript
// libs/monitoring/src/monitoring.module.ts
import { Module, Global } from '@nestjs/common';
import {
  PrismaAuthModule,
  PrismaUsersModule,
  PrismaCityModule,
  PrismaCoreModule,
  PrismaNotificationModule,
  PrismaSchedulerModule,
  PrismaIntegrationModule,
  PrismaAdminModule,
} from '@kodi/prisma';
import { MonitoringService } from './monitoring.service';

@Global()
@Module({
  imports: [
    // Import all Prisma modules - services not available will be undefined
    PrismaAuthModule,
    PrismaUsersModule,
    PrismaCityModule,
    PrismaCoreModule,
    PrismaNotificationModule,
    PrismaSchedulerModule,
    PrismaIntegrationModule,
    PrismaAdminModule,
  ],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
```

```typescript
// libs/monitoring/src/monitoring.service.ts
import { Injectable, Optional } from '@nestjs/common';
import {
  PrismaAuthService,
  PrismaUsersService,
  PrismaCityService,
  PrismaCoreService,
  PrismaNotificationService,
  PrismaSchedulerService,
  PrismaIntegrationService,
  PrismaAdminService,
} from '@kodi/prisma';

@Injectable()
export class MonitoringService {
  constructor(
    // Use @Optional() to allow services to be undefined
    // This way, monitoring works in any microservice even if not all DBs are available
    @Optional() private readonly prismaAuth?: PrismaAuthService,
    @Optional() private readonly prismaUsers?: PrismaUsersService,
    @Optional() private readonly prismaCity?: PrismaCityService,
    @Optional() private readonly prismaCore?: PrismaCoreService,
    @Optional() private readonly prismaNotification?: PrismaNotificationService,
    @Optional() private readonly prismaScheduler?: PrismaSchedulerService,
    @Optional() private readonly prismaIntegration?: PrismaIntegrationService,
    @Optional() private readonly prismaAdmin?: PrismaAdminService,
  ) {}

  async collectDatabaseMetrics() {
    const prismaServices = [
      { name: 'auth', service: this.prismaAuth },
      { name: 'users', service: this.prismaUsers },
      { name: 'city', service: this.prismaCity },
      { name: 'core', service: this.prismaCore },
      { name: 'notification', service: this.prismaNotification },
      { name: 'scheduler', service: this.prismaScheduler },
      { name: 'admin', service: this.prismaAdmin },
    ].filter((p) => p.service !== undefined);

    // Collect metrics from all available databases
    const metrics = await Promise.all(
      prismaServices.map(async ({ name, service }) => {
        try {
          await service!.healthCheck();
          return { name, healthy: true };
        } catch {
          return { name, healthy: false };
        }
      }),
    );

    return metrics;
  }
}
```

## Import Paths

You can import Prisma services using either:

1. **Alias paths** (recommended):

   ```typescript
   import { PrismaAuthService } from '@kodi/prisma-auth';
   import { PrismaAuthModule } from '@kodi/prisma-auth';
   import { PrismaAdminService } from '@kodi/prisma-admin';
   import { PrismaAdminModule } from '@kodi/prisma-admin';
   ```

2. **Main index** (also supported):
   ```typescript
   import { PrismaAuthService, PrismaAuthModule } from '@kodi/prisma';
   ```

## Important Notes

### Global Modules

All Prisma modules are decorated with `@Global()`, which means:

- Once imported in `AppModule`, they're available throughout the entire application
- You don't need to re-import them in feature modules
- Services can be injected anywhere in the application

### Module Initialization

Each Prisma service:

- Automatically connects to the database on module initialization (`onModuleInit`)
- Automatically disconnects on module destruction (`onModuleDestroy`)
- Includes health check method: `healthCheck(): Promise<boolean>`
- Logs connection/disconnection events

### Optional Dependencies

When using `@Optional()` decorator:

- Services that aren't imported will be `undefined`
- Always check for existence before using: `if (this.prismaAuth) { ... }`
- Useful for shared libraries that may be used in different microservices

### Best Practices

1. **Single Responsibility**: Each microservice should primarily use its own Prisma service
2. **Cross-Service Communication**: Prefer RabbitMQ/HTTP for inter-service communication rather than direct database access
3. **Database Access**: Only access other databases when necessary for monitoring, aggregation, or reporting
4. **Error Handling**: Always handle cases where Prisma services might be unavailable
5. **Health Checks**: Use the built-in `healthCheck()` method for monitoring

## Example: Complete Service Implementation

```typescript
// apps/users/src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUsersService } from '@kodi/prisma-users';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaUsersService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async create(data: { email: string; firstName: string; lastName: string }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }
}
```

## Troubleshooting

### Issue: "Cannot find module '@kodi/prisma-auth'"

**Solution**: Make sure you've run:

```bash
yarn prisma:generate
```

### Issue: "PrismaService is not defined" or injection fails

**Solution**: Ensure you've imported the Prisma module in your `AppModule`:

```typescript
@Module({
  imports: [PrismaAuthModule], // Don't forget this!
})
export class AppModule {}
```

### Issue: Multiple Prisma services causing conflicts

**Solution**: Each service connects to a different database, so there should be no conflicts. If you see connection issues, check your database connection strings in `.env`.

## Related Documentation

- [Project Structure](./STRUCTURE.md)
- [Getting Started](./GETTING_STARTED.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
