#!/bin/bash

# KODI Microservices - Environment Setup Script
# This script creates .env and .env.example files

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KODI Microservices - Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create .env.example
echo -e "${BLUE}Creating .env.example...${NC}"
cat > .env.example << 'EOF'
# ============================================================================
# KODI Microservices - Environment Configuration
# ============================================================================
# Copy this file to .env: cp env.template .env
# Then update with your actual values
# ============================================================================

# ============================================================================
# Node Environment
# ============================================================================
NODE_ENV=development
SERVICE_VERSION=1.0.0

# ============================================================================
# PostgreSQL Server Configuration (Shared)
# ============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=kodi
POSTGRES_PASSWORD=changeme

# ============================================================================
# Per-Service Database Configuration
# ============================================================================

# Auth Service (Port 3001)
AUTH_PORT=3001
AUTH_DB_NAME=kodi_auth
AUTH_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_auth

# Users Service (Port 3002)
USERS_PORT=3002
USERS_DB_NAME=kodi_users
USERS_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_users

# City Service (Port 3003)
CITY_PORT=3003
CITY_DB_NAME=kodi_city
CITY_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_city

# Core Service (Port 3004)
CORE_PORT=3004
CORE_DB_NAME=kodi_core
CORE_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_core

# Notification Service (Port 3005)
NOTIFICATION_PORT=3005
NOTIFICATION_DB_NAME=kodi_notification
NOTIFICATION_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_notification

# Scheduler Service (Port 3006)
SCHEDULER_PORT=3006
SCHEDULER_DB_NAME=kodi_scheduler
SCHEDULER_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_scheduler

# Integration Service (Port 3007)
INTEGRATION_PORT=3007
INTEGRATION_DB_NAME=kodi_integration
INTEGRATION_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_integration

# Admin Service (Port 3008)
ADMIN_PORT=3008
ADMIN_DB_NAME=kodi_admin
ADMIN_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_admin

# Terminal Service (Port 3009)
TERMINAL_PORT=3009
TERMINAL_DB_NAME=kodi_terminal
TERMINAL_DATABASE_URL=postgresql://kodi:changeme@localhost:5432/kodi_terminal

# ============================================================================
# Redis Configuration (Shared Cache)
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# ============================================================================
# RabbitMQ Configuration (Shared Message Queue)
# ============================================================================
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
RABBITMQ_PROMETHEUS_PORT=15692
RABBITMQ_USER=kodi
RABBITMQ_PASSWORD=changeme
RABBITMQ_VHOST=/
RABBITMQ_URL=amqp://kodi:changeme@localhost:5672
RABBITMQ_QUEUE=kodi_queue

# ============================================================================
# JWT Configuration - ⚠️  CHANGE IN PRODUCTION!
# ============================================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================================
# Logging Configuration
# ============================================================================
LOG_LEVEL=debug
LOG_DIR=./logs
ENABLE_FILE_LOGGING=false

# ============================================================================
# API Configuration
# ============================================================================
API_PREFIX=api
# Enable API gateway prefix for Swagger (set to 'true' for production/server)
# When enabled, Swagger will show /api/{service} paths; when disabled (local dev), no prefix
ENABLE_API_GATEWAY_PREFIX=false
# API Gateway Base URL (e.g., https://api.49.13.145.221.nip.io)
# If set, verification links and other service URLs will use this gateway URL
# Leave empty for local development (will use direct service URLs)
API_GATEWAY_BASE_URL=
CORS_ORIGIN=*
REQUEST_TIMEOUT_MS=30000

# ============================================================================
# Rate Limiting / Throttling
# ============================================================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ============================================================================
# Swagger/OpenAPI Documentation
# ============================================================================
SWAGGER_TITLE=KODI Microservices API
SWAGGER_DESCRIPTION=API documentation for KODI microservices
SWAGGER_VERSION=1.0

# ============================================================================
# Internationalization (i18n) Configuration
# ============================================================================
# Default language code (ISO 639-1) used when Accept-Language header is missing
I18N_DEFAULT_LANGUAGE=en

# Supported languages (comma-separated internal codes)
# Languages: de (German), en (English), dk (Danish), no (Norwegian), se (Swedish),
#            ar (Arabic), fa (Persian/Farsi), tr (Turkish), ru (Russian), uk (Ukrainian)
#
# Note: The backend automatically maps standard ISO 639-1 codes from Accept-Language header:
#   - da (Danish ISO 639-1) → dk (internal code)
#   - sv (Swedish ISO 639-1) → se (internal code)
I18N_SUPPORTED_LANGUAGES=de,en,dk,no,se,ar,fa,tr,ru,uk

# ============================================================================
# Email/SMTP Configuration
# ============================================================================
SYSTEM_EMAIL_ID=noreply@kodi.example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# ============================================================================
# Client/Frontend URL
# ============================================================================
CLIENT_URL=http://localhost:4200

# ============================================================================
# Monitoring & Alerting
# ============================================================================
SERVICE_NAME=kodi-service
METRICS_ENABLED=true

# Alert Webhook (optional)
ALERT_WEBHOOK_URL=

# Alert Email (optional)
ALERT_SMTP_HOST=smtp.gmail.com
ALERT_SMTP_PORT=587
ALERT_SMTP_USER=alerts@example.com
ALERT_SMTP_PASS=
ALERT_FROM_EMAIL=alerts@example.com
ALERT_TO_EMAILS=admin@example.com

# Slack Webhook (optional)
ALERT_SLACK_WEBHOOK_URL=

# ============================================================================
# Development/Debug Configuration (uncomment for debugging)
# ============================================================================
# DEBUG=*
# PRISMA_LOG_LEVEL=query,info,warn,error

# ============================================================================
# Docker Compose
# ============================================================================
COMPOSE_PROJECT_NAME=kodi

# ============================================================================
# Monitoring & Observability
# ============================================================================
# Prometheus
PROMETHEUS_PORT=9090

# Alertmanager
ALERTMANAGER_PORT=9093

# Grafana
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
GRAFANA_ALLOW_SIGN_UP=false
GRAFANA_ROOT_URL=http://localhost:3000

# Metrics Exporters
NODE_EXPORTER_PORT=9100
POSTGRES_EXPORTER_PORT=9187
REDIS_EXPORTER_PORT=9121

# ============================================================================
# Administration Tools
# ============================================================================
# pgAdmin
PGADMIN_PORT=5050
PGADMIN_EMAIL=admin@kodi.com
PGADMIN_PASSWORD=admin

# Redis Commander
REDIS_COMMANDER_PORT=8081
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin

# ============================================================================
# Reverse Proxy (Nginx)
# ============================================================================
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
EOF

echo -e "${GREEN}✓ Created .env.example${NC}"

# Create .env if it doesn't exist
if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env already exists, skipping...${NC}"
else
    echo -e "${BLUE}Creating .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Update .env with your actual values!${NC}"
    echo -e "${YELLOW}  Especially change JWT_SECRET and JWT_REFRESH_SECRET${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Environment setup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Edit .env with your actual values"
echo -e "  2. Update JWT secrets with strong random values"
echo -e "  3. Configure database credentials if needed"
echo ""
echo -e "${BLUE}Generate random secrets:${NC}"
echo -e "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
