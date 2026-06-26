# KODI Microservices

<!-- kodi-badges -->
![Open Source](https://img.shields.io/badge/Open%20Source-Ja-brightgreen.svg) ![Smart City](https://img.shields.io/badge/Smart%20City-Kommunal-orange.svg) ![Sprache](https://img.shields.io/badge/Sprache-TypeScript-informational.svg) ![KODI](https://img.shields.io/badge/KODI-Entwicklergemeinschaft-blueviolet.svg)
<!-- /kodi-badges -->

A production-ready NestJS microservices monorepo with Docker, Prisma ORM, RabbitMQ messaging, Redis caching, and comprehensive observability.

## Overview

KODI is a scalable microservice architecture built with distributed system design principles. The platform leverages core business logic, city services, notifications, scheduling, and authentication to deliver a comprehensive municipal management solution. The system is designed for high availability, scalability, and maintainability, supporting multi-tenant operations across different cities and jurisdictions.

## Roles

The KODI platform supports three primary user roles:

- **Super Admin**: System administrators with full access to all features and configurations across all cities and services
- **City Admins**: City-level administrators who manage operations, users, and services within their assigned city jurisdiction
- **Citizens**: End users who interact with city services, receive notifications, and access public-facing features

## Core Features

### Authentication & Authorization

- **JWT-based authentication** with secure token management
- **Role-based access control (RBAC)** for fine-grained permissions
- Support for access and refresh token workflows
- Multi-tenant authentication with city-scoped access

### Centralized Business Logic

- **Core Service** orchestrates centralized business logic and workflows
- Single source of truth for business rules and processes
- Ensures consistency across all microservices
- Handles complex business operations and state management

### City Services

- Comprehensive city data management with geolocation support
- Multi-tenant architecture supporting multiple cities
- City-scoped operations and data isolation
- Geographic and administrative city management

### Notifications & Scheduling

- **Multi-channel notifications** (Email, SMS, Push notifications)
- **Scheduled tasks and cron jobs** for automated operations
- Event-driven notification system
- Flexible scheduling for recurring and one-time tasks

### Monitoring & Observability

- **Comprehensive monitoring** with Prometheus metrics
- **Application metrics** exposed at `/metrics` endpoints
- **Alerts and notifications** via Alertmanager
- Distributed tracing and logging capabilities
- Health checks and service status monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     KODI Platform                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Users   │  │   City   │  │   Core   │   │
│  │  :3001   │  │  :3002   │  │  :3003   │  │  :3004   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│  ┌────┴─────────────┴──────────────┴─────────────┴─────┐   │
│  │                Shared Libraries                       │   │
│  │  - Prisma  - Logger  - RabbitMQ  - Redis  - JWT     │   │
│  │  - Metrics - Interceptors                            │   │
│  └───────────────────────────────────────────────────────┘   │
│       │             │              │             │          │
│  ┌────┴─────┐  ┌───┴──────┐  ┌───┴──────┐  ┌───┴──────┐   │
│  │Notification│ │Scheduler│                                  │
│  │  :3005   │  │  :3006   │                                  │
│  └──────────┘  └──────────┘                                  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Infrastructure Layer                             │
│  ┌────────────┐  ┌──────────┐  ┌────────────────────┐      │
│  │ PostgreSQL │  │  Redis   │  │     RabbitMQ       │      │
│  │   :5432    │  │  :6379   │  │  :5672  :15672     │      │
│  └────────────┘  └──────────┘  └────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service          | Port | Description                                      |
| ---------------- | ---- | ------------------------------------------------ |
| **auth**         | 3001 | JWT authentication, login, logout, token refresh |
| **users**        | 3002 | User CRUD operations with soft deletes           |
| **city**         | 3003 | City data management with geolocation            |
| **core**         | 3004 | Core business logic orchestration                |
| **notification** | 3005 | Multi-channel notifications (email, SMS, push)   |
| **scheduler**    | 3006 | Cron jobs and scheduled tasks                    |

## Quick Start

> 📖 **New to the project?** Check out [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for a detailed 3-minute setup guide!

### Prerequisites

- Node.js >= 24.11.0
- Yarn >= 1.22.0
- Docker & Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd kodi.microservices

# Install dependencies and generate Prisma client
yarn bootstrap
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, update:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - Database credentials (if not using Docker defaults)
```

### 3. Start Infrastructure

**Option A: Development (docker-compose.dev.yml)**

```bash
# Start PostgreSQL, Redis, RabbitMQ using Docker
docker compose -f docker-compose.dev.yml up -d postgres redis rabbitmq

# Wait for services to be ready (~10 seconds)
# Note: Databases are automatically created on first startup via infra/postgres/init-databases.sh
```

**Option B: Production with Profiles (Step-wise)**

```bash
# Start infrastructure first
yarn docker:up:infra

# Wait for services to be ready (~10 seconds)
# Note: Databases are automatically created on first startup via infra/postgres/init-databases.sh
```

### 4. Generate Prisma Clients

```bash
yarn prisma:generate
```

### 5. Run Database Migrations

```bash
yarn prisma:migrate
```

### 6. Start Services

#### Option A: Run all services locally (hot-reload)

```bash
# Run all services concurrently
yarn dev

# Or run individual services
yarn dev:auth
yarn dev:terminal
```

#### Option B: Run services in Docker

```bash
# Start all services with infrastructure
docker compose -f docker-compose.dev.yml up
```

### 6. Verify

Visit service endpoints:

- Auth: http://localhost:3001/healthz
- Users: http://localhost:3002/healthz
- City: http://localhost:3003/healthz
- Metrics: http://localhost:3001/metrics

## Development Workflow

### Running Individual Services

```bash
# Start a specific service with hot-reload from root
yarn dev:auth
```

### Database Management

```bash
# Create a new migration
yarn prisma:migrate

# Generate Prisma client after schema changes
yarn prisma:generate

# Open Prisma Studio (DB GUI)
yarn prisma:studio

# Seed database (if seed script exists)
yarn prisma:seed
```

### Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:cov
```

### Linting & Formatting

```bash
# Lint all code
yarn lint

# Format all code
yarn format
```

## Project Structure

```
kodi.microservices/
├── apps/                      # Microservices
│   ├── auth/                  # Authentication service
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── modules/
│   │   │       └── auth/
│   │   └── tsconfig.app.json
│   ├── users/                 # User management service
│   ├── city/                  # City data service
│   ├── core/                  # Core business logic service
│   ├── notification/          # Notification service
│   ├── scheduler/             # Scheduled tasks service
│
├── libs/                      # Shared libraries
│   ├── prisma/                # Database ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── logger/                # Winston logger
│   ├── rabbitmq/              # Message queue
│   ├── redis/                 # Caching
│   ├── jwt/                   # Authentication
│   ├── interceptors/          # Common interceptors
│   └── metrics/               # Prometheus metrics
│
├── docker-compose.dev.yml     # Development environment
├── docker-compose.yml         # Production environment
├── package.json               # Root package config
├── tsconfig.json              # TypeScript config
├── nest-cli.json              # NestJS CLI config
└── .env.example               # Environment variables template
```

## Docker Commands

> ⚠️ **Note**: Profile-based deployment is a temporary feature for development. For production, use the `full` profile or deploy all services together.

### Profile-Based Deployment (Development)

The project uses Docker Compose profiles to enable step-wise deployment during development:

- **`infra`** - Infrastructure services (PostgreSQL, Redis, RabbitMQ, Nginx, pgAdmin, Redis Commander)
- **`services`** - Microservices (auth, users, city, core, notification, scheduler, admin)
- **`full`** - All services (infra + services)
- **`monitoring`** - Monitoring stack (Prometheus, Grafana, Alertmanager, exporters)

#### Step-Wise Deployment (Recommended for Development)

```bash
# Step 1: Start infrastructure first
yarn docker:up:infra
# or
docker compose --profile infra up -d

# Step 2: Start microservices after infra is ready
yarn docker:up:services
# or
docker compose --profile services up -d
```

#### Infrastructure Only

```bash
# Build infrastructure services
yarn docker:build:infra

# Start infrastructure
yarn docker:up:infra

# View infrastructure logs
yarn docker:logs:infra

# Stop infrastructure
yarn docker:down:infra
```

#### Microservices Only

```bash
# Build microservices (requires infra to be running)
yarn docker:build:services

# Start microservices
yarn docker:up:services

# View microservices logs
yarn docker:logs:services

# Stop microservices
yarn docker:down:services
```

### Full Deployment

#### Development

```bash
# Start all infrastructure services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (reset database)
docker compose -f docker-compose.dev.yml down -v
```

#### Production

```bash
# Build all service images (full profile)
yarn docker:build
# or
docker compose --profile full build

# Start production environment (all services)
yarn docker:up
# or
docker compose --profile full up -d

# Start with monitoring stack
yarn docker:up:prod
# or
docker compose --profile full --profile monitoring up -d

# View logs
yarn docker:logs
# or
docker compose --profile full logs -f

# Scale a specific service
docker compose --profile full up -d --scale users=3

# Stop production environment
yarn docker:down
# or
docker compose --profile full down
```

### Available Scripts

**Build Commands:**

- `yarn docker:build` - Build all services (full profile)
- `yarn docker:build:prod` - Build with full + monitoring
- `yarn docker:build:infra` - Build only infrastructure
- `yarn docker:build:services` - Build only microservices

**Up Commands:**

- `yarn docker:up` - Start all services (full profile)
- `yarn docker:up:prod` - Start with full + monitoring
- `yarn docker:up:infra` - Start only infrastructure
- `yarn docker:up:services` - Start only microservices

**Down Commands:**

- `yarn docker:down` - Stop all services
- `yarn docker:down:infra` - Stop only infrastructure
- `yarn docker:down:services` - Stop only microservices

**Logs Commands:**

- `yarn docker:logs` - Logs for all services
- `yarn docker:logs:prod` - Logs with monitoring
- `yarn docker:logs:infra` - Logs for infrastructure
- `yarn docker:logs:services` - Logs for microservices

## API Examples

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# Use the returned accessToken in subsequent requests
TOKEN="your-access-token-here"

# Validate token
curl -X POST http://localhost:3001/auth/validate \
  -H "Authorization: Bearer $TOKEN"
```

### Users Service

```bash
# Get all users (paginated)
curl http://localhost:3002/users?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"

# Get specific user
curl http://localhost:3002/users/user-id-here \
  -H "Authorization: Bearer $TOKEN"

# Update user
curl -X PATCH http://localhost:3002/users/user-id-here \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "firstName": "Jane" }'
```

### City Service

```bash
# Create a city
curl -X POST http://localhost:3003/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "San Francisco",
    "country": "USA",
    "state": "California",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "population": 884363
  }'

# Find nearby cities
curl "http://localhost:3003/cities/search/nearby?lat=37.7749&lng=-122.4194&radius=50"
```

### Notifications

```bash
# Send notification
curl -X POST http://localhost:3005/notifications/notify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "type": "INFO",
    "channel": "EMAIL",
    "subject": "Welcome!",
    "content": "Welcome to KODI platform!"
  }'

# Get user notifications
curl http://localhost:3005/notifications/user-id-here \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable                 | Description                  | Default                  |
| ------------------------ | ---------------------------- | ------------------------ |
| `NODE_ENV`               | Environment                  | `development`            |
| `DATABASE_URL`           | PostgreSQL connection string | See .env.example         |
| `REDIS_URL`              | Redis connection string      | `redis://localhost:6379` |
| `RABBITMQ_URL`           | RabbitMQ connection string   | `amqp://localhost:5672`  |
| `JWT_SECRET`             | JWT access token secret      | **CHANGE IN PRODUCTION** |
| `JWT_REFRESH_SECRET`     | JWT refresh token secret     | **CHANGE IN PRODUCTION** |
| `JWT_EXPIRES_IN`         | Access token expiry          | `15m`                    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry         | `7d`                     |
| `LOG_LEVEL`              | Logging level                | `debug`                  |
| `SERVICE_NAME`           | Service identifier           | `kodi-service`          |

## Monitoring & Observability

### Metrics

Each service exposes Prometheus-compatible metrics at `/metrics`:

```bash
# View auth service metrics
curl http://localhost:3001/metrics
```

**Available Metrics:**

- `kodi_http_request_duration_seconds` - HTTP request duration histogram
- `kodi_http_requests_total` - Total HTTP requests counter
- `kodi_http_request_errors_total` - HTTP errors counter
- `kodi_active_connections` - Active connections gauge
- Plus default Node.js metrics (memory, CPU, etc.)

### Health Checks

Each service has a health endpoint:

```bash
# Check service health
curl http://localhost:3001/healthz
```

Response includes database, Redis, and RabbitMQ status.

### Logging

Logs are output to console in structured JSON format (production) or colorized format (development).

Log levels: `error`, `warn`, `info`, `debug`, `verbose`

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f auth
```

## Production Deployment Checklist

Before deploying to production:

### 1. Security

- [ ] Change all default secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS appropriately
- [ ] Enable helmet security headers (already configured)
- [ ] Implement rate limiting per endpoint (ThrottlerModule configured)
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rotate secrets regularly (recommended: every 90 days)

### 2. Database

- [ ] Configure automated backups (daily recommended)
- [ ] Set up point-in-time recovery
- [ ] Enable connection pooling
- [ ] Configure read replicas for scaling
- [ ] Set appropriate retention policies

### 3. Caching & Message Queue

- [ ] Configure Redis persistence (AOF + RDS)
- [ ] Set up Redis cluster for high availability
- [ ] Configure RabbitMQ clustering
- [ ] Enable RabbitMQ message persistence
- [ ] Set up dead letter queues

### 4. Monitoring & Alerting

- [ ] Set up Prometheus for metrics collection
- [ ] Configure Grafana dashboards
- [ ] Set up log aggregation (ELK Stack, Loki, or CloudWatch)
- [ ] Create alerts for critical metrics:
  - High error rates (>5%)
  - Slow response times (>500ms p95)
  - High memory usage (>80%)
  - Database connection failures
- [ ] Define SLOs (e.g., 99.9% availability)

### 5. Infrastructure

- [ ] Use container orchestration (Kubernetes, ECS)
- [ ] Configure auto-scaling
- [ ] Set up load balancers
- [ ] Configure CDN for static assets
- [ ] Enable distributed tracing (Jaeger, OpenTelemetry)

### 6. CI/CD

- [ ] Automated testing in pipeline
- [ ] Automated security scanning
- [ ] Blue-green or canary deployments
- [ ] Rollback strategy defined

### 7. Documentation

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Runbook for common issues
- [ ] Disaster recovery procedures
- [ ] On-call rotation setup

## Troubleshooting

### Services won't start

```bash
# Check if ports are in use
lsof -i :3001-3006

# Check Docker services
docker compose -f docker-compose.dev.yml ps

# View service logs
docker compose -f docker-compose.dev.yml logs
```

### Database connection errors

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Test connection
docker exec -it kodi-postgres-dev psql -U kodi -d kodi_db

# Check DATABASE_URL in .env
```

### Prisma migration errors

```bash
# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# Generate client
yarn prisma:generate
```

### Hot-reload not working

```bash
# Clear dist and node_modules
rm -rf dist node_modules apps/*/node_modules libs/*/node_modules

# Reinstall
yarn bootstrap
```

## Documentation

### Getting Started

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - 3-minute quick start guide
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Architecture deep dive and design patterns
- **[Project Structure](docs/STRUCTURE.md)** - Complete file tree and organization reference

### Contributing & Community

- **[Contributing Guidelines](CONTRIBUTING.md)** - Development workflow, code style, and PR process
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines and standards
- **[Security Policy](SECURITY.md)** - Reporting vulnerabilities and security best practices
- **[Changelog](CHANGELOG.md)** - Version history and changes

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for detailed guidelines.

**Quick Summary:**

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run linting: `yarn lint:all`
4. Run tests: `yarn test:all`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and create a pull request

## License

This project is licensed under the **European Union Public Licence (EUPL) v. 1.2** (SPDX: `EUPL-1.2`). See the [LICENSE](LICENSE) file for the full text and [the official EUPL collection](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12) on the Interoperable Europe Portal.

## Support

For issues and questions:

- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section above

---

**Built with** ❤️ **using NestJS, Prisma, Docker, RabbitMQ, and Redis**