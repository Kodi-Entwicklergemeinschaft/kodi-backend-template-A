# KODI Microservices - Project Overview

## Summary

A production-ready NestJS microservices monorepo featuring:

- 7 microservices (auth, users, city, core, notification, scheduler, integration)
- 7 shared libraries (prisma, logger, rabbitmq, redis, jwt, interceptors, metrics)
- Docker development and production environments
- Comprehensive observability (logging, metrics, health checks)
- Complete developer tooling (VSCode, ESLint, Prettier)

## Tech Stack

### Core Framework

- **NestJS** 10.x - Progressive Node.js framework
- **TypeScript** 5.x - Type-safe JavaScript
- **Node.js** 24 LTS - JavaScript runtime

### Database & ORM

- **PostgreSQL** 16 - Primary database
- **Prisma** 5.x - Type-safe ORM with migrations

### Messaging & Caching

- **RabbitMQ** 3.x - Message broker for async communication
- **Redis** 7.x - Caching and session storage
- **@nestjs/microservices** - NestJS microservices transport

### Authentication & Security

- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **@nestjs/throttler** - Rate limiting

### Observability

- **Winston** - Structured logging
- **prom-client** - Prometheus metrics
- **@nestjs/terminus** - Health checks

### Development Tools

- **NestJS CLI** - Monorepo management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Docker** - Containerization

## Architecture Patterns

### 1. Microservices Architecture

Each service is independent, has its own domain, and communicates via:

- **HTTP/REST** - Synchronous API calls
- **RabbitMQ** - Asynchronous event-driven messaging
- **Shared Database** - Single PostgreSQL instance (can be split)

### 2. Monorepo Structure

- **apps/** - Individual microservices
- **libs/** - Shared, reusable libraries
- Benefits: Code reuse, atomic changes, simplified dependency management

### 3. Layered Architecture

Each service follows:

```
Controller (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access via Prisma)
```

### 4. Event-Driven Communication

Services emit events via RabbitMQ for:

- User lifecycle (created, updated, deleted)
- Notifications (queued, sent, failed)
- Scheduled tasks (executed, completed)
- Integrations (webhook received, sync completed)

### 5. Shared Library Pattern

Common functionality extracted to reusable libraries:

- **@kodi/prisma** - Database access
- **@kodi/logger** - Structured logging
- **@kodi/rabbitmq** - Message queue client
- **@kodi/redis** - Cache client
- **@kodi/jwt** - Authentication
- **@kodi/interceptors** - Request/response handling
- **@kodi/metrics** - Prometheus metrics

## Service Details

### Auth Service (Port 3001)

**Purpose:** User authentication and authorization

**Key Features:**

- User registration with password hashing
- JWT-based login/logout
- Access and refresh token management
- Token validation endpoint
- Redis-backed token storage

**Dependencies:** Prisma, Redis, JWT, RabbitMQ

**Events Emitted:** `user.created`

---

### Users Service (Port 3002)

**Purpose:** User management and CRUD operations

**Key Features:**

- User CRUD operations
- Pagination support
- Soft delete functionality
- Event emission for user changes

**Dependencies:** Prisma, RabbitMQ

**Events Emitted:** `user.created`, `user.updated`, `user.deleted`

---

### City Service (Port 3003)

**Purpose:** Geographic data management

**Key Features:**

- City CRUD operations
- Geolocation search (nearby cities)
- Country filtering
- Distance calculation (Haversine formula)

**Dependencies:** Prisma

---

### Core Service (Port 3004)

**Purpose:** Business logic orchestration and cross-service operations

**Key Features:**

- Aggregated operations across services
- Event listener for cross-service coordination
- Caching for frequently accessed data

**Dependencies:** RabbitMQ, Redis

**Events Listened:** All service events

---

### Notification Service (Port 3005)

**Purpose:** Multi-channel notification delivery

**Key Features:**

- Multi-channel support (Email, SMS, Push, In-App)
- Notification queuing via RabbitMQ
- Delivery tracking and status management
- Template support (ready for extension)

**Dependencies:** Prisma, RabbitMQ

**Events Emitted:** `notification.sent`, `notification.failed`

**Events Listened:** `notification.send`

---

### Scheduler Service (Port 3006)

**Purpose:** Cron jobs and scheduled task execution

**Key Features:**

- Cron-based task scheduling (@nestjs/schedule)
- Task management API
- Distributed locking via Redis
- Execution tracking and history

**Dependencies:** Prisma, RabbitMQ, Redis

**Events Emitted:** `schedule.execute`, `schedule.completed`

---

### Integration Service (Port 3007)

**Purpose:** External API integrations and webhook handling

**Key Features:**

- Webhook receiver for multiple providers
- HTTP client for external API calls
- Integration logging and monitoring
- Event forwarding to other services

**Dependencies:** Prisma, RabbitMQ, HttpModule

**Events Emitted:** `integration.webhook`

## Shared Libraries

### @kodi/prisma

**Purpose:** Database access layer

**Features:**

- Prisma client wrapper
- Connection lifecycle management
- Health checks
- Query logging (development)

**Schema Models:**

- User (authentication and profiles)
- City (geographic data)
- Notification (notification records)
- Schedule (scheduled tasks)
- Integration (external integrations)
- IntegrationLog (integration activity logs)

---

### @kodi/logger

**Purpose:** Structured logging

**Features:**

- Winston-based logger
- Async context tracking (request IDs)
- Service name injection
- Colorized console (dev) / JSON (prod)
- Log level configuration

---

### @kodi/rabbitmq

**Purpose:** Message queue client

**Features:**

- NestJS microservices ClientProxy wrapper
- Publish/subscribe helpers
- Request-response pattern support
- Connection retry logic
- Predefined event patterns

---

### @kodi/redis

**Purpose:** Caching and session storage

**Features:**

- ioredis wrapper
- Get/set/delete operations
- TTL support
- Pub/sub support
- Distributed locking
- Set operations

---

### @kodi/jwt

**Purpose:** JWT authentication

**Features:**

- Token generation (access + refresh)
- Token verification
- Passport JWT strategy
- Auth guards
- User decorators (@GetCurrentUser)
- Public route decorator (@Public)

---

### @kodi/interceptors

**Purpose:** Common request/response interceptors

**Interceptors:**

- **LoggingInterceptor** - Request/response logging with timing
- **TimeoutInterceptor** - Request timeout (30s default)
- **TransformInterceptor** - Response wrapper with metadata
- **ValidationInterceptor** - Enhanced validation error formatting

---

### @kodi/metrics

**Purpose:** Prometheus metrics collection

**Features:**

- prom-client integration
- HTTP request metrics (duration, count, errors)
- Custom metric creation (counter, gauge, histogram)
- Metrics endpoint `/metrics`
- Metrics interceptor for auto-tracking

## Data Models

### User

```prisma
id          String
email       String   @unique
password    String   (hashed)
role        UserRole (USER | ADMIN | MODERATOR)
firstName   String?
lastName    String?
isActive    Boolean
createdAt   DateTime
updatedAt   DateTime
deletedAt   DateTime? (soft delete)
```

### City

```prisma
id          String
name        String
country     String
state       String?
latitude    Float
longitude   Float
population  Int?
timezone    String?
metadata    Json?
isActive    Boolean
createdAt   DateTime
updatedAt   DateTime
```

### Notification

```prisma
id        String
userId    String
type      NotificationType (INFO | WARNING | ERROR | SUCCESS | ALERT)
channel   NotificationChannel (EMAIL | SMS | PUSH | IN_APP)
subject   String?
content   String
metadata  Json?
status    NotificationStatus (PENDING | SENT | FAILED | DELIVERED | READ)
sentAt    DateTime?
readAt    DateTime?
createdAt DateTime
updatedAt DateTime
```

### Schedule

```prisma
id             String
name           String
description    String?
cronExpression String
payload        Json?
isEnabled      Boolean
lastRun        DateTime?
lastRunStatus  String?
nextRun        DateTime?
runCount       Int
createdAt      DateTime
updatedAt      DateTime
```

### Integration

```prisma
id          String
userId      String
provider    IntegrationProvider (STRIPE | SENDGRID | TWILIO | SLACK | WEBHOOK | CUSTOM)
name        String
credentials Json? (encrypted)
webhookUrl  String?
config      Json?
isActive    Boolean
lastSyncAt  DateTime?
createdAt   DateTime
updatedAt   DateTime
```

## Event Patterns

### User Events

- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User soft deleted

### Notification Events

- `notification.send` - Request to send notification
- `notification.sent` - Notification successfully sent
- `notification.failed` - Notification delivery failed

### City Events

- `city.created` - New city added
- `city.updated` - City data updated
- `city.deleted` - City deactivated

### Schedule Events

- `schedule.execute` - Task execution triggered
- `schedule.completed` - Task execution finished

### Integration Events

- `integration.webhook` - Webhook received from provider
- `integration.sync` - Synchronization requested

### Core Events

- `core.operation` - Cross-service operation initiated

## Security Considerations

### Implemented

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT with short-lived access tokens (15min)
- ✅ Refresh tokens with longer expiry (7 days)
- ✅ Token storage in Redis for revocation
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation (class-validator)
- ✅ Rate limiting (ThrottlerModule)
- ✅ SQL injection protection (Prisma)

### Recommended for Production

- 🔲 HTTPS/TLS everywhere
- 🔲 Secrets management (Vault, AWS Secrets Manager)
- 🔲 API key authentication for service-to-service
- 🔲 Request signing for webhooks
- 🔲 DDoS protection (Cloudflare, AWS Shield)
- 🔲 Audit logging
- 🔲 Penetration testing
- 🔲 Dependency scanning (Snyk, Dependabot)

## Scalability Strategy

### Horizontal Scaling

- Each service can be scaled independently
- Stateless design (except for in-memory caching)
- Load balancer distributes traffic

### Database Scaling

- Connection pooling (Prisma)
- Read replicas for read-heavy queries
- Sharding for very large datasets
- Separate databases per service (future)

### Caching Strategy

- Redis for frequently accessed data
- TTL-based cache invalidation
- Cache-aside pattern

### Message Queue Scaling

- RabbitMQ clustering
- Message persistence
- Dead letter queues for failed messages
- Consumer scaling

## Monitoring Strategy

### Metrics (Prometheus)

- HTTP request duration (p50, p95, p99)
- Request count by endpoint
- Error rate
- Active connections
- Memory usage
- CPU usage

### Logging (Winston)

- Structured JSON logs
- Request/response logging
- Error logging with stack traces
- Context tracking (request IDs)

### Health Checks

- Liveness checks (is service running?)
- Readiness checks (can service handle traffic?)
- Dependency checks (DB, Redis, RabbitMQ)

### Alerting (Recommended)

- Error rate > 5%
- Response time p95 > 500ms
- Memory usage > 80%
- Database connection failures
- Queue depth > 1000 messages

## Development Workflow

1. **Feature Branch**: Create from main
2. **Local Development**: Use hot-reload
3. **Testing**: Unit + integration tests
4. **Code Review**: PR with CI checks
5. **Merge**: Squash and merge
6. **Deploy**: Automated via CI/CD

## Deployment Options

### Option 1: Docker Compose (Simple)

- Single host deployment
- Suitable for: Small-scale, development, staging

### Option 2: Kubernetes (Recommended for Production)

- Multi-host deployment
- Auto-scaling
- Self-healing
- Rolling updates
- Suitable for: Production, high-scale

### Option 3: Managed Services

- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Suitable for: Simplified operations

## Performance Characteristics

### Expected Performance (Single Instance)

- Auth Service: ~500 req/s
- Users Service: ~1000 req/s (read-heavy)
- City Service: ~2000 req/s (read-heavy)
- Notification Service: ~100 req/s (write-heavy)

### Bottlenecks

- Database connections (pool size: 10)
- RabbitMQ throughput
- Redis memory

### Optimization Tips

- Use Redis caching aggressively
- Batch database operations
- Async operations via RabbitMQ
- CDN for static assets
- Database indexing

## Future Enhancements

### Short Term

- [ ] Swagger/OpenAPI documentation
- [ ] E2E test suite
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database seeding scripts

### Medium Term

- [ ] Separate databases per service
- [ ] GraphQL API gateway
- [ ] WebSocket support
- [ ] File upload service
- [ ] Email templates (Handlebars)

### Long Term

- [ ] Multi-region deployment
- [ ] gRPC inter-service communication
- [ ] Kafka for event streaming
- [ ] Elasticsearch for search
- [ ] Machine learning integration

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review error rates, optimize slow queries
- **Monthly**: Dependency updates, security patches
- **Quarterly**: Performance testing, capacity planning

### Backup Strategy

- **Database**: Daily automated backups, 30-day retention
- **Redis**: AOF persistence, hourly snapshots
- **RabbitMQ**: Message persistence enabled
- **Code**: Git repository (off-site)

## Support & Resources

### Documentation

- `../README.md` - Main documentation (root)
- `../CONTRIBUTING.md` - Contribution guidelines (root)
- `../CODE_OF_CONDUCT.md` - Community standards (root)
- `../SECURITY.md` - Security policy (root)
- `../CHANGELOG.md` - Version history (root)
- `GETTING_STARTED.md` - Quick start guide
- `PROJECT_OVERVIEW.md` - This file
- `STRUCTURE.md` - Project structure

### Tools

- Prisma Studio - Database GUI
- RabbitMQ Management - Queue monitoring
- Grafana - Metrics visualization
- VSCode - Debugging configuration included

---

**Last Updated:** 2025-01-29
**Version:** 1.0.0
**Maintainer:** KODI Team
