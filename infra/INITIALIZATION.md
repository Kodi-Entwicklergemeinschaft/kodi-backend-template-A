# KODI Infrastructure - Initialization Guide

This document explains how infrastructure components are initialized and configured.

## PostgreSQL Database Auto-Initialization

### Development (Docker)

PostgreSQL databases are **automatically created** on first container startup via:

- **Script**: `infra/postgres/init-databases.sh`
- **Location**: `/docker-entrypoint-initdb.d/init-databases.sh` (mounted in container)
- **When it runs**: Only on first container start (when data directory is empty)
- **What it creates**: All 7 microservice databases
  - `kodi_auth`
  - `kodi_users`
  - `kodi_city`
  - `kodi_core`
  - `kodi_notification`
  - `kodi_scheduler`

### How It Works

1. Docker Compose mounts the init script into the PostgreSQL container
2. PostgreSQL's official image runs all scripts in `/docker-entrypoint-initdb.d/` on first startup
3. The script checks if databases exist before creating them (idempotent)
4. Subsequent container starts skip initialization (data already exists)

### Production Initialization

For production, use the initialization script:

```bash
./scripts/init-production.sh
```

This script:

1. Validates environment configuration
2. Creates all databases
3. Generates Prisma clients
4. Deploys migrations
5. Verifies setup

## Infrastructure Configuration

### Monitoring Stack

- **Prometheus**: Configured via `infra/prometheus/prometheus.yml`
- **Grafana**: Auto-provisioned via `infra/grafana/provisioning/`
- **Alertmanager**: Configured via `infra/alertmanager/alertmanager.yml`

### Reverse Proxy

- **Nginx**: Configured via `infra/nginx/nginx.conf`
- SSL certificates: Place in `infra/nginx/ssl/` (not included in repo)

### Message Queue

- **RabbitMQ**:
  - Configuration: `infra/rabbitmq/rabbitmq.conf`
  - Queues, exchanges, and bindings are created dynamically by `RmqSetupService` on service startup

## First-Time Setup Checklist

### Development

1. ✅ Copy `.env` from `env.template`
2. ✅ Generate secrets: `./scripts/generate-secrets.sh`
3. ✅ Start infrastructure: `docker compose -f docker-compose.dev.yml up -d postgres redis rabbitmq`
   - Databases auto-created on first startup
4. ✅ Generate Prisma clients: `yarn prisma:generate`
5. ✅ Run migrations: `yarn prisma:migrate`

### Production

1. ✅ Set up `.env` with production values
2. ✅ Generate secure secrets: `./scripts/generate-secrets.sh`
3. ✅ Run production initialization: `./scripts/init-production.sh`
4. ✅ Start infrastructure: `docker compose up -d`
5. ✅ Verify all services: Check health endpoints

## Troubleshooting

### Databases Not Created Automatically

If databases weren't created on first startup:

1. Check if data volume exists (prevents re-initialization):

   ```bash
   docker volume ls | grep postgres_data
   ```

2. Remove volume to force re-initialization (⚠️ **deletes data**):

   ```bash
   docker compose -f docker-compose.dev.yml down -v
   docker compose -f docker-compose.dev.yml up -d postgres
   ```

3. Or create databases manually using psql:
   ```bash
   # Connect to PostgreSQL and create databases manually
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_auth;"
   # Repeat for other databases: kodi_users, kodi_city, etc.
   ```

### Init Script Not Running

The init script only runs if:

- The data directory is empty
- This is the first container startup
- The script is properly mounted

Check logs:

```bash
docker logs kodi-postgres-dev
```

Look for "Database Setup" messages indicating the script ran.
