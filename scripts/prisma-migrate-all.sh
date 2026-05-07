#!/bin/bash

# Script to run migrations for all microservice databases
# This script must be run from the project root directory
# Prerequisites:
# 1. PostgreSQL server must be running
# 2. All databases must exist (created automatically by Docker via infra/postgres/init-databases.sh)
# 3. .env file must be configured with all database URLs

set -e

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

# Auto-detect if running from host (where postgres hostname doesn't resolve)
# If postgres hostname is used and we're on host, convert to localhost
if ! ping -c 1 postgres >/dev/null 2>&1; then
  echo "⚠️  Running from host machine - converting postgres:5432 to localhost:5432"
  export AUTH_DATABASE_URL=$(echo ${AUTH_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export USERS_DATABASE_URL=$(echo ${USERS_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export CITY_DATABASE_URL=$(echo ${CITY_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export CORE_DATABASE_URL=$(echo ${CORE_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export NOTIFICATION_DATABASE_URL=$(echo ${NOTIFICATION_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export SCHEDULER_DATABASE_URL=$(echo ${SCHEDULER_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
  export ADMIN_DATABASE_URL=$(echo ${ADMIN_DATABASE_URL:-} | sed 's/@postgres:5432/@localhost:5432/')
fi

echo "🗄️  Running migrations for all microservice databases..."
echo ""
echo "⚠️  This will apply schema changes to all databases."
if [[ -t 0 ]]; then
  read -p "Continue? (y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 0
  fi
fi

# Active microservices
ACTIVE_SERVICES=("auth" "users" "city" "core" "notification" "scheduler" "admin")

# FUTURE SERVICES - Uncomment to include when activating
# FUTURE_SERVICES=("terminal")

# Use ACTIVE_SERVICES by default, or combine if FUTURE_SERVICES are uncommented
SERVICES=("${ACTIVE_SERVICES[@]}")
# Uncomment below to include future services:
# SERVICES=("${ACTIVE_SERVICES[@]}" "${FUTURE_SERVICES[@]}")

for service in "${SERVICES[@]}"; do
  echo ""
  echo "📦 Running migration for: $service"
  echo "Database: kodi_$service"

  # Check if database URL is set
  DB_URL_VAR="${service^^}_DATABASE_URL"
  if [ -z "${!DB_URL_VAR}" ]; then
    echo "⚠️  Warning: $DB_URL_VAR not set in environment"
    continue
  fi

  # Run migration
  SCHEMA_PATH="libs/prisma/src/schemas/$service/schema.prisma"
  if npx prisma migrate dev --schema="$SCHEMA_PATH" --name init; then
    echo "✅ Migration for $service completed successfully"
  else
    echo "❌ Migration for $service failed"
    exit 1
  fi
done

# Note: Permissions, Listings, and SystemConfig are now all in core.prisma
# They will be migrated when the core service migration runs above

echo ""
echo "🎉 All migrations completed successfully!"
echo ""
echo "💡 Next steps:"
echo "   - Verify migrations: npx prisma studio --schema=libs/prisma/src/schemas/<service>/schema.prisma"
echo "   - Start microservices: docker compose up"
