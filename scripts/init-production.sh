#!/bin/bash

# KODI Microservices - Production Initialization Script
# This script performs the initial setup for production deployment
# Should be run once during first production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KODI Microservices - Production Init${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file from env.template${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env file found${NC}"

# Load environment variables
if [ -f .env ]; then
  set -a
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    # Export the variable (handles KEY=value format safely)
    eval "export $line" 2>/dev/null || true
  done < .env
  set +a
fi

# Check if required environment variables are set
REQUIRED_VARS=(
    "POSTGRES_HOST"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
)

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}❌ Error: $VAR not set in .env${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Required environment variables set${NC}"

# Warn if using default secrets
if [[ "$JWT_SECRET" == *"change-this"* ]] || [[ "$JWT_SECRET" == *"your-secret"* ]]; then
    echo -e "${YELLOW}⚠ WARNING: JWT_SECRET appears to be a default value${NC}"
    echo -e "${YELLOW}  Please generate secure secrets before production deployment${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Please update secrets first."
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Step 1: Database creation${NC}"
echo -e "${YELLOW}ℹ Databases will be created automatically by Docker on first startup${NC}"
echo -e "${YELLOW}  via infra/postgres/init-databases.sh${NC}"

echo ""
echo -e "${BLUE}Step 2: Generating Prisma clients...${NC}"
if [ -f scripts/prisma-generate-all.sh ]; then
    ./scripts/prisma-generate-all.sh
else
    echo -e "${YELLOW}⚠ prisma-generate-all.sh not found, skipping...${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Deploying database migrations...${NC}"
if [ -f scripts/prisma-migrate-prod.sh ]; then
    ./scripts/prisma-migrate-prod.sh
else
    echo -e "${YELLOW}⚠ prisma-migrate-prod.sh not found, skipping...${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Verifying setup...${NC}"

# Verify databases exist
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_USER=${POSTGRES_USER:-kodi}
DB_PASSWORD=${POSTGRES_PASSWORD}

# Active microservices
ACTIVE_SERVICES=("auth" "users" "city" "core" "notification" "scheduler" "integration" "admin")

# FUTURE SERVICES - Uncomment to include when activating
# FUTURE_SERVICES=("terminal")

# Use ACTIVE_SERVICES by default, or combine if FUTURE_SERVICES are uncommented
SERVICES=("${ACTIVE_SERVICES[@]}")
# Uncomment below to include future services:
# SERVICES=("${ACTIVE_SERVICES[@]}" "${FUTURE_SERVICES[@]}")

for service in "${SERVICES[@]}"; do
    DB_NAME="kodi_$service"
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${GREEN}✓ Database $DB_NAME exists${NC}"
    else
        echo -e "${RED}❌ Database $DB_NAME not found${NC}"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Production initialization completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify all services can connect to databases"
echo -e "  2. Start infrastructure: docker compose up -d"
echo -e "  3. Start microservices"
echo -e "  4. Verify health checks: curl http://localhost:3001/healthz"
echo ""
