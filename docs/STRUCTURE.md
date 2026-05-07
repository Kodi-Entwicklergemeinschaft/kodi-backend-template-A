# Project Structure

Complete file tree for the KODI microservices monorepo.

## Root Level

```
kodi.microservices/
├── README.md                      # Main documentation
├── CONTRIBUTING.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md             # Community guidelines
├── SECURITY.md                    # Security policy
├── CHANGELOG.md                   # Version history
├── LICENSE                        # EUPL-1.2
├── Makefile                       # Make commands for common tasks
│
├── docs/                          # Technical documentation
│   ├── GETTING_STARTED.md         # Quick start guide
│   ├── PROJECT_OVERVIEW.md        # Architecture and design
│   └── STRUCTURE.md               # This file
│
├── package.json                   # Root package configuration
├── yarn.lock                      # Dependency lock file
├── tsconfig.json                  # TypeScript configuration
├── nest-cli.json                  # NestJS CLI configuration
│
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore patterns
├── .dockerignore                  # Docker ignore patterns
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .editorconfig                  # Editor configuration
│
├── docker-compose.dev.yml         # Development Docker Compose
├── docker-compose.yml             # Production Docker Compose
│
├── infra/                         # Infrastructure configuration
│   ├── shared/
│   │   └── Dockerfile            # Shared multi-stage Dockerfile for all services
│   ├── prometheus/               # Prometheus metrics configuration
│   ├── grafana/                  # Grafana dashboard provisioning
│   ├── alertmanager/             # Alertmanager configuration
│   ├── nginx/                    # Nginx reverse proxy configuration
│   └── rabbitmq/                 # RabbitMQ configuration
│
├── .vscode/                       # VSCode configuration
│   ├── launch.json                # Debug configurations
│   ├── settings.json              # Editor settings
│   └── extensions.json            # Recommended extensions
│
├── apps/                          # Microservices
│   ├── auth/                      # Authentication service
│   ├── users/                     # User management service
│   ├── city/                      # City data service
│   ├── core/                      # Core business logic service
│   ├── notification/              # Notification service
│   ├── scheduler/                 # Scheduled tasks service
│   └── integration/               # External integrations service
│
└── libs/                          # Shared libraries
    ├── prisma/                    # Database ORM
    ├── logger/                    # Winston logging
    ├── rabbitmq/                  # Message queue
    ├── redis/                     # Caching
    ├── jwt/                       # Authentication
    ├── interceptors/              # HTTP interceptors
    └── metrics/                   # Prometheus metrics
```

## Microservices (apps/)

Each service follows this structure:

```
apps/[service-name]/
├── package.json                   # Service dependencies
├── tsconfig.app.json              # TypeScript config
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts              # Root module
│   ├── health.controller.ts       # Health check endpoint
│   └── modules/
│       └── [feature]/
│           ├── [feature].module.ts
│           ├── [feature].controller.ts
│           ├── [feature].service.ts
│           ├── [feature].service.spec.ts
│           └── dto/
│               ├── index.ts
│               ├── create-[feature].dto.ts
│               └── update-[feature].dto.ts
```

### Auth Service (apps/auth/)

```
apps/auth/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── auth/
            ├── auth.module.ts
            ├── auth.controller.ts
            ├── auth.service.ts
            └── dto/
                ├── index.ts
                ├── login.dto.ts
                ├── register.dto.ts
                └── refresh-token.dto.ts
```

### Users Service (apps/users/)

```
apps/users/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── users/
            ├── users.module.ts
            ├── users.controller.ts
            ├── users.service.ts
            └── dto/
                ├── index.ts
                ├── create-user.dto.ts
                └── update-user.dto.ts
```

### City Service (apps/city/)

```
apps/city/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── city/
            ├── city.module.ts
            ├── city.controller.ts
            ├── city.service.ts
            └── dto/
                ├── index.ts
                ├── create-city.dto.ts
                └── update-city.dto.ts
```

### Core Service (apps/core/)

```
apps/core/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── core/
            ├── core.module.ts
            ├── core.controller.ts
            └── core.service.ts
```

### Notification Service (apps/notification/)

```
apps/notification/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── notification/
            ├── notification.module.ts
            ├── notification.controller.ts
            ├── notification.service.ts
            └── dto/
                ├── index.ts
                └── send-notification.dto.ts
```

### Scheduler Service (apps/scheduler/)

```
apps/scheduler/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── tasks/
            ├── tasks.module.ts
            ├── tasks.controller.ts
            ├── tasks.service.ts
            └── dto/
                ├── index.ts
                └── create-task.dto.ts
```

### Integration Service (apps/integration/)

```
apps/integration/
├── package.json
├── tsconfig.app.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health.controller.ts
    └── modules/
        └── integration/
            ├── integration.module.ts
            ├── integration.controller.ts
            └── integration.service.ts
```

## Shared Libraries (libs/)

Each library follows this structure:

```
libs/[library-name]/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts                   # Public API exports
    ├── [library].module.ts        # NestJS module
    ├── [library].service.ts       # Service implementation
    └── [additional files]
```

### Prisma Library (libs/prisma/)

```
libs/prisma/
├── package.json
├── tsconfig.lib.json
├── prisma/
│   └── schema.prisma              # Database schema
└── src/
    ├── index.ts
    ├── prisma.module.ts
    └── prisma.service.ts
```

### Logger Library (libs/logger/)

```
libs/logger/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── logger.module.ts
    └── logger.service.ts
```

### RabbitMQ Library (libs/rabbitmq/)

```
libs/rabbitmq/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── rabbitmq.module.ts
    └── rabbitmq.service.ts
```

### Redis Library (libs/redis/)

```
libs/redis/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── redis.module.ts
    └── redis.service.ts
```

### JWT Library (libs/jwt/)

```
libs/jwt/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── jwt.module.ts
    ├── jwt.service.ts
    ├── jwt.strategy.ts
    ├── jwt-auth.guard.ts
    └── decorators/
        ├── public.decorator.ts
        ├── roles.decorator.ts
        └── current-user.decorator.ts
```

### Interceptors Library (libs/interceptors/)

```
libs/interceptors/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── logging.interceptor.ts
    ├── timeout.interceptor.ts
    ├── transform.interceptor.ts
    └── validation.interceptor.ts
```

### Metrics Library (libs/metrics/)

```
libs/metrics/
├── package.json
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── metrics.module.ts
    ├── metrics.service.ts
    ├── metrics.controller.ts
    └── metrics.interceptor.ts
```

## File Count Summary

### Root Files: 15

- **Documentation**: 5 (README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md, LICENSE)
- **Configuration**: 8 (package.json, tsconfig, nest-cli, eslint, prettier, editorconfig, etc.)
- **Docker**: 2 (docker-compose.dev.yml, docker-compose.yml)

### Documentation (docs/): 4 files

- GETTING_STARTED.md - Quick start guide
- PROJECT_OVERVIEW.md - Architecture deep dive
- STRUCTURE.md - Project structure reference

### Apps (7 services): ~120 files

- **auth**: 13 files (main, app, health, module, controller, service, 3 DTOs, etc.)
- **users**: 13 files (similar structure)
- **city**: 13 files (similar structure)
- **core**: 9 files (simpler structure)
- **notification**: 11 files
- **scheduler**: 11 files
- **integration**: 9 files

### Libs (7 libraries): ~35 files

- **prisma**: 4 files (module, service, schema, index)
- **logger**: 3 files (module, service, index)
- **rabbitmq**: 3 files (module, service, index)
- **redis**: 3 files (module, service, index)
- **jwt**: 8 files (module, service, strategy, guard, 3 decorators, index)
- **interceptors**: 5 files (4 interceptors, index)
- **metrics**: 5 files (module, service, controller, interceptor, index)

### Total: ~170 source files

## Import Paths

The monorepo uses TypeScript path mappings for clean imports:

```typescript
// Shared libraries
import { PrismaService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { RabbitMQService } from '@kodi/rabbitmq';
import { RedisService } from '@kodi/redis';
import { JwtTokenService } from '@kodi/jwt';
import { LoggingInterceptor } from '@kodi/interceptors';
import { MetricsService } from '@kodi/metrics';

// Example usage in a service
@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly rabbitmq: RabbitMQService,
  ) {}
}
```

## Key Configuration Files

### package.json (Root)

- Root-level scripts (bootstrap, dev, build, test, etc.)
- Common dependencies and devDependencies
- Single source of truth for all packages

### tsconfig.json

- TypeScript configuration
- Path mappings for @kodi/\* imports
- Compiler options shared across all projects

### nest-cli.json

- Monorepo configuration
- All apps and libs registered
- Build and compilation settings

### docker-compose.dev.yml

- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (ports 5672, 15672)
- pgAdmin (port 5050)

### docker-compose.yml (Production)

- All infrastructure services
- All 7 microservices
- Health checks and restart policies
- Network isolation

## Build Artifacts (Generated)

```
kodi.microservices/
├── node_modules/                  # Dependencies (gitignored)
├── dist/                          # Compiled JavaScript (gitignored)
│   ├── apps/
│   │   ├── auth/
│   │   ├── users/
│   │   └── ...
│   └── libs/
│       ├── prisma/
│       └── ...
├── coverage/                      # Test coverage reports (gitignored)
└── logs/                          # Application logs (gitignored)
```

## Port Allocation

| Service             | Port  | Purpose                     |
| ------------------- | ----- | --------------------------- |
| auth                | 3001  | Authentication service      |
| users               | 3002  | User management service     |
| city                | 3003  | City data service           |
| core                | 3004  | Core business logic service |
| notification        | 3005  | Notification service        |
| scheduler           | 3006  | Scheduler service           |
| integration         | 3007  | Integration service         |
| PostgreSQL          | 5432  | Database                    |
| pgAdmin             | 5050  | Database GUI                |
| Redis               | 6379  | Cache                       |
| RabbitMQ            | 5672  | Message queue               |
| RabbitMQ Management | 15672 | Queue management UI         |

## Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Database
DATABASE_URL=postgresql://kodi:kodi_password@localhost:5432/kodi_db

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://kodi:kodi_password@localhost:5672

# JWT
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Service Ports
AUTH_SERVICE_PORT=3001
USERS_SERVICE_PORT=3002
# ... etc
```

## Development Tools

### Makefile Commands

```bash
make help          # Show all commands
make install       # Install dependencies
make dev           # Start all services
make docker-up     # Start infrastructure
make migrate       # Run migrations
make test          # Run tests
make clean         # Clean artifacts
```

### Yarn Commands

```bash
yarn bootstrap      # Install + generate Prisma
yarn dev            # Run all services
yarn dev:auth       # Run specific service
yarn build          # Build all services
yarn build:auth     # Build specific service
yarn test           # Test all
yarn lint           # Lint all
```

### VSCode Debugging

- F5 to start debugging
- Multiple debug configurations available
- Compound configurations to debug multiple services
- Jest test debugging included

---

**Note:** This structure is optimized for:

- ✅ Maintainability (clear separation of concerns)
- ✅ Scalability (independent services)
- ✅ Developer Experience (hot reload, debugging, tooling)
- ✅ Code Reuse (shared libraries)
- ✅ Production Readiness (Docker, metrics, health checks)
