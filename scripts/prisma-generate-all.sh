#!/bin/bash

# Script to generate all Prisma clients for each microservice
# This script must be run from the project root directory

set -e

echo "🔧 Generating Prisma Clients for all microservices..."
echo ""

# Active microservices
ACTIVE_SERVICES=("auth" "users" "city" "core" "notification" "scheduler" "admin")

# FUTURE SERVICES - Uncomment to include when activating
# FUTURE_SERVICES=("terminal")

# Use ACTIVE_SERVICES by default, or combine if FUTURE_SERVICES are uncommented
SERVICES=("${ACTIVE_SERVICES[@]}")
# Uncomment below to include future services:
# SERVICES=("${ACTIVE_SERVICES[@]}" "${FUTURE_SERVICES[@]}")

for service in "${SERVICES[@]}"; do
  echo "📦 Generating Prisma client for: $service"
  SCHEMA_PATH="libs/prisma/src/schemas/$service/schema.prisma"
  if [ ! -f "$SCHEMA_PATH" ]; then
    echo "⚠️  Skipping $service: schema not found at $SCHEMA_PATH"
    continue
  fi
  npx prisma generate --schema="$SCHEMA_PATH"
  echo "✅ Prisma client for $service generated successfully"
  echo ""
done

echo "🎉 All Prisma clients generated successfully!"
