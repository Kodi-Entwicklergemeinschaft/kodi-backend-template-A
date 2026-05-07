#!/bin/bash
# Sequential Docker build script to prevent memory exhaustion
# Builds services one at a time instead of in parallel

set -e

echo "🔨 Building Docker images sequentially to prevent memory issues..."
echo ""

# List of services to build (in order)
SERVICES=(
  "auth"
  "users"
  "city"
  "core"
  "notification"
  "scheduler"
  "admin"
)

# Build each service one at a time
for service in "${SERVICES[@]}"; do
  echo "📦 Building ${service}..."
  docker compose build "${service}" || {
    echo "❌ Failed to build ${service}"
    exit 1
  }
  echo "✅ ${service} built successfully"
  echo ""
done

echo "🎉 All services built successfully!"
