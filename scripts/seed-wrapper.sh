#!/bin/bash

# Wrapper script for seed scripts that handles Docker hostname conversion
# Usage: ./scripts/seed-wrapper.sh <seed-script-path>
# Example: ./scripts/seed-wrapper.sh scripts/seed-initial-admin.ts

set -e

if [ $# -eq 0 ]; then
  echo "❌ Error: No seed script provided"
  echo "Usage: $0 <seed-script-path>"
  echo "Example: $0 scripts/seed-initial-admin.ts"
  exit 1
fi

SEED_SCRIPT="$1"

if [ ! -f "$SEED_SCRIPT" ]; then
  echo "❌ Error: Seed script not found: $SEED_SCRIPT"
  exit 1
fi

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

# Run the seed script (forward all additional CLI args to the underlying script)
echo "🌱 Running seed script: $SEED_SCRIPT"
npx ts-node -r tsconfig-paths/register "$SEED_SCRIPT" "${@:2}"
