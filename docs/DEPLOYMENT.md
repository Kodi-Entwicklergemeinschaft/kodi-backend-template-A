# KODI Microservices - Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Hetzner Server Setup](#hetzner-server-setup)
4. [Initial Server Configuration](#initial-server-configuration)
5. [Application Deployment](#application-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Starting Services](#starting-services)
9. [SSL & Domain Configuration](#ssl--domain-configuration)
10. [Monitoring Stack](#monitoring-stack)
11. [Backup & Restore](#backup--restore)
12. [Maintenance Operations](#maintenance-operations)
13. [Troubleshooting](#troubleshooting)
14. [Security Checklist](#security-checklist)

---

## Overview

### Architecture

KODI is a microservices-based application consisting of:

| Service      | Port | Description                               |
| ------------ | ---- | ----------------------------------------- |
| auth         | 3001 | Authentication & JWT management           |
| users        | 3002 | User management & profiles                |
| city         | 3003 | City configuration & settings             |
| core         | 3004 | Core business logic, listings, categories |
| notification | 3005 | Push notifications & email                |
| scheduler    | 3006 | Scheduled tasks & cron jobs               |
| integration  | 3007 | External API integrations                 |
| admin        | 3008 | Admin dashboard API                       |

### Infrastructure Components

- **PostgreSQL 16** - Database (separate DB per service)
- **Redis 7.4** - Caching & session storage
- **RabbitMQ 4.1** - Message queue for inter-service communication
- **Caddy 2.7** - Reverse proxy with automatic SSL

---

## Prerequisites

### Hetzner Cloud Requirements

- **Recommended Server**: CX31 or higher (4 vCPU, 8GB RAM, 80GB SSD)
- **Minimum**: CX21 (2 vCPU, 4GB RAM, 40GB SSD)
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Region**: FSN1 (Falkenstein) or NBG1 (Nuremberg)

### Domain Requirements

- A registered domain pointing to your Hetzner server IP
- Or use nip.io for development: `api.<SERVER_IP>.nip.io`

---

## Hetzner Server Setup

### 1. Create the Server

```bash
# Via Hetzner Cloud Console or CLI
hcloud server create \
  --name kodi-production \
  --type cx31 \
  --image ubuntu-22.04 \
  --location fsn1 \
  --ssh-key your-ssh-key
```

### 2. Configure DNS (if using custom domain)

Add these DNS records pointing to your server IP:

```
A     @              → <SERVER_IP>
A     api            → <SERVER_IP>
A     kodi.kodi-app → <SERVER_IP>
```

---

## Initial Server Configuration

### 1. Connect to the Server

```bash
ssh root@<SERVER_IP>
```

### 2. Update System & Install Dependencies

```bash
# Update packages
apt update && apt upgrade -y

# Install required packages
apt install -y \
  curl \
  git \
  make \
  ufw \
  fail2ban \
  htop \
  unzip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 3. Create Application User

```bash
# Create user for running the application
adduser --disabled-password --gecos "" kodi
usermod -aG docker kodi

# Setup SSH access for kodi user
mkdir -p /home/kodi/.ssh
cp ~/.ssh/authorized_keys /home/kodi/.ssh/
chown -R kodi:kodi /home/kodi/.ssh
chmod 700 /home/kodi/.ssh
chmod 600 /home/kodi/.ssh/authorized_keys
```

### 4. Configure Firewall

```bash
# Configure UFW firewall
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS (for Caddy reverse proxy)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Verify rules
ufw status verbose
```

### 5. Configure Fail2Ban

```bash
# Enable and start fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Application Deployment

### 1. Clone the Repository

```bash
# Switch to kodi user
su - kodi

# Create project directory
mkdir -p ~/Projects/KODI
cd ~/Projects/KODI

# Clone repository
git clone <your-repo-url> kodi.microservices
cd kodi.microservices
```

### 2. Create Data Directory

```bash
# Create data directory for persistent storage
mkdir -p data/{postgres,redis,rabbitmq,caddy,caddy-config,prometheus,grafana,alertmanager}

# Set permissions
chmod -R 755 data
```

---

## Environment Configuration

### 1. Create Environment File

```bash
# Copy template
cp env.template .env
```

### 2. Generate Secure Secrets

```bash
# Run the secret generator script
./scripts/generate-secrets.sh
```

### 3. Configure Production Environment

Edit `.env` with production values:

```bash
nano .env
```

**Critical settings to update:**

```env
# ============================================================================
# Node Environment
# ============================================================================
NODE_ENV=production

# ============================================================================
# PostgreSQL - Use generated password
# ============================================================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=kodi
POSTGRES_PASSWORD=<GENERATED_PASSWORD>

# Update ALL database URLs with postgres hostname and new password
AUTH_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_auth
USERS_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_users
CITY_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_city
CORE_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_core
NOTIFICATION_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_notification
SCHEDULER_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_scheduler
INTEGRATION_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_integration
ADMIN_DATABASE_URL=postgresql://kodi:<GENERATED_PASSWORD>@postgres:5432/kodi_admin

# ============================================================================
# Redis - MANDATORY password in production
# ============================================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<GENERATED_PASSWORD>
REDIS_URL=redis://:<GENERATED_PASSWORD>@redis:6379

# ============================================================================
# RabbitMQ
# ============================================================================
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=kodi
RABBITMQ_PASSWORD=<GENERATED_PASSWORD>
RABBITMQ_URL=amqp://kodi:<GENERATED_PASSWORD>@rabbitmq:5672

# ============================================================================
# JWT - Use generated secrets
# ============================================================================
JWT_SECRET=<GENERATED_64_CHAR_SECRET>
JWT_REFRESH_SECRET=<GENERATED_64_CHAR_SECRET>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================================
# Domain Configuration
# ============================================================================
# Option 1: Custom domain
API_DOMAIN=kodi.kodi-app.de

# Option 2: nip.io (replace with your server IP)
# DEV_IP=49.13.145.221
# API_DOMAIN=api.49.13.145.221.nip.io

# ============================================================================
# SSL Configuration
# ============================================================================
LETSENCRYPT_EMAIL=admin@your-domain.com
LETSENCRYPT_STAGING=false  # Set to 'true' for testing

# ============================================================================
# API Configuration
# ============================================================================
ENABLE_API_GATEWAY_PREFIX=true
API_GATEWAY_BASE_URL=https://kodi.kodi-app.de
CORS_ORIGIN=https://kodi.kodi-app.de,https://admin.kodi-app.de

# ============================================================================
# Frontend Path (if serving React app)
# ============================================================================
REACT_BUILD_PATH=/home/kodi/Projects/KODI/kodi-frontend/build

# ============================================================================
# Monitoring Credentials
# ============================================================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<STRONG_PASSWORD>

# ============================================================================
# Admin Tools Credentials
# ============================================================================
PGADMIN_EMAIL=admin@kodi.com
PGADMIN_PASSWORD=<STRONG_PASSWORD>
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=<STRONG_PASSWORD>
```

---

## Database Setup

### 1. Start Infrastructure Services

```bash
# Start only infrastructure (PostgreSQL, Redis, RabbitMQ)
docker compose up -d postgres redis rabbitmq

# Wait for services to be healthy
docker compose ps

# Check PostgreSQL logs for database creation
docker logs kodi-postgres
```

### 2. Verify Databases Created

The databases are automatically created on first startup via `infra/postgres/init-databases.sh`:

```bash
# Connect to PostgreSQL and verify
docker exec -it kodi-postgres psql -U kodi -c "\l"
```

Expected databases:

- `kodi_auth`
- `kodi_users`
- `kodi_city`
- `kodi_core`
- `kodi_notification`
- `kodi_scheduler`
- `kodi_integration`
- `kodi_admin`

### 3. Run Database Migrations

```bash
# Deploy all migrations to production
./scripts/prisma-migrate-prod.sh
```

---

## Starting Services

### 1. Build Docker Images

```bash
# Build all microservice images (this may take 10-15 minutes)
docker compose build

# Or build sequentially if memory is limited
./scripts/docker-build-sequential.sh
```

### 2. Start All Services

```bash
# Start all services
docker compose up -d

# Verify all services are running
docker compose ps
```

### 3. Check Service Health

```bash
# Check all service health endpoints
curl -s https://<YOUR_DOMAIN>/api/auth/healthz
curl -s https://<YOUR_DOMAIN>/api/users/healthz
curl -s https://<YOUR_DOMAIN>/api/city/healthz
curl -s https://<YOUR_DOMAIN>/api/core/healthz
curl -s https://<YOUR_DOMAIN>/api/notification/healthz
curl -s https://<YOUR_DOMAIN>/api/scheduler/healthz
curl -s https://<YOUR_DOMAIN>/api/integration/healthz
curl -s https://<YOUR_DOMAIN>/api/admin/healthz
```

### 4. Run Initial Seed Data

```bash
# Run all seed scripts to populate initial data
./scripts/seed-all.sh

# Or run specific seeds
./scripts/seed-all.sh --only seed:initial-admin,seed:permissions
```

---

## SSL & Domain Configuration

### Using nip.io (Quick Setup)

For quick deployment without a custom domain:

```env
DEV_IP=<YOUR_SERVER_IP>
API_DOMAIN=api.<YOUR_SERVER_IP>.nip.io
```

Caddy automatically obtains SSL certificates via Let's Encrypt.

### Using Custom Domain

1. Point your domain DNS to the server IP
2. Update `.env`:

```env
API_DOMAIN=kodi.kodi-app.de
LETSENCRYPT_EMAIL=admin@kodi-app.de
```

3. Restart Caddy:

```bash
docker compose restart caddy
```

### Verify SSL

```bash
# Check SSL certificate
curl -vI https://<YOUR_DOMAIN>/health 2>&1 | grep -A5 "Server certificate"
```

---

## Monitoring Stack

### Enable Monitoring Services

```bash
# Start monitoring stack
docker compose --profile monitoring up -d

# Verify monitoring services
docker compose ps
```

### Access Monitoring Tools

| Tool         | URL (via SSH tunnel)    | Credentials            |
| ------------ | ----------------------- | ---------------------- |
| Grafana      | `http://localhost:3000` | `admin` / env password |
| Prometheus   | `http://localhost:9090` | -                      |
| Alertmanager | `http://localhost:9093` | -                      |

### SSH Tunnel for Monitoring Access

```bash
# From your local machine
ssh -L 3000:127.0.0.1:3000 -L 9090:127.0.0.1:9090 kodi@<SERVER_IP>
```

Then access Grafana at `http://localhost:3000`

---

## Backup & Restore

### Automated Backup

```bash
# Run backup script
./scripts/backup-data.sh
```

Backups are stored in `./backups/backup_YYYYMMDD_HHMMSS/`

### Manual PostgreSQL Backup

```bash
# Backup all databases
docker exec kodi-postgres pg_dumpall -U kodi > backup_$(date +%Y%m%d).sql

# Backup specific database
docker exec kodi-postgres pg_dump -U kodi kodi_core > kodi_core_backup.sql
```

### Restore from Backup

```bash
# Restore PostgreSQL
docker exec -i kodi-postgres psql -U kodi < backup.sql

# Restore data directory
cd data
tar -xzf /path/to/backup/postgres.tar.gz
```

### Recommended Backup Schedule

Add to crontab (`crontab -e`):

```bash
# Daily backup at 3 AM
0 3 * * * cd /home/kodi/Projects/KODI/kodi.microservices && ./scripts/backup-data.sh >> /var/log/kodi-backup.log 2>&1

# Weekly PostgreSQL dump
0 4 * * 0 docker exec kodi-postgres pg_dumpall -U kodi | gzip > /home/kodi/backups/postgres_weekly_$(date +\%Y\%m\%d).sql.gz
```

---

## Maintenance Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth

# Last 100 lines
docker compose logs --tail=100 core
```

### Restart Services

```bash
# Restart single service
docker compose restart auth

# Restart all services
docker compose restart

# Full restart (down + up)
docker compose down && docker compose up -d
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d

# Run new migrations
./scripts/prisma-migrate-prod.sh
```

### Scale Services (if needed)

```bash
# Scale a specific service
docker compose up -d --scale core=2
```

### Clean Up

```bash
# Remove unused images
docker image prune -f

# Remove unused volumes (CAUTION: can delete data)
docker volume prune -f

# Full cleanup
./scripts/docker-cleanup.sh
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check container status
docker compose ps

# Inspect container
docker inspect kodi-<service-name>
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check database connectivity
docker exec -it kodi-postgres psql -U kodi -c "SELECT 1"

# Verify database URLs in .env use 'postgres' hostname (not localhost)
grep DATABASE_URL .env
```

### Memory Issues During Build

```bash
# Use sequential builds
./scripts/docker-build-sequential.sh

# Or increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### SSL Certificate Issues

```bash
# Check Caddy logs
docker compose logs caddy

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Service Health Check Failures

```bash
# Check specific service health
curl -v http://localhost:300X/healthz

# Check from inside Docker network
docker compose exec caddy curl http://auth:3001/healthz
```

---

## Security Checklist

### Pre-Deployment

- [ ] Generated unique secrets using `./scripts/generate-secrets.sh`
- [ ] Updated all passwords in `.env` (no default values)
- [ ] Redis password is set (`REDIS_PASSWORD`)
- [ ] JWT secrets are at least 64 characters
- [ ] PostgreSQL password is strong

### Network Security

- [ ] UFW firewall enabled with only ports 22, 80, 443 open
- [ ] Fail2ban configured and running
- [ ] Admin tools (pgAdmin, Redis Commander) bound to localhost only
- [ ] Monitoring tools bound to localhost only

### Application Security

- [ ] `NODE_ENV=production` set
- [ ] `CORS_ORIGIN` restricted to specific domains
- [ ] SSL/HTTPS enforced via Caddy
- [ ] `LETSENCRYPT_STAGING=false` for production certificates

### Operational Security

- [ ] SSH key authentication only (password disabled)
- [ ] Regular backups configured
- [ ] Log monitoring in place
- [ ] Secrets not committed to version control

---

## Quick Reference Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart service
docker compose restart <service>

# Run migrations
./scripts/prisma-migrate-prod.sh

# Backup data
./scripts/backup-data.sh

# Health check
curl https://<domain>/health
```
