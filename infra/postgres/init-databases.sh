#!/bin/bash
# PostgreSQL Database Auto-Initialization Script
# This script automatically creates all required databases for microservices
# Runs on first container startup via docker-entrypoint-initdb.d

set -e

# Database names for each microservice
# Active services
DATABASES=(
    "kodi_auth"
    "kodi_users"
    "kodi_city"
    "kodi_core"
    "kodi_notification"
    "kodi_scheduler"
    "kodi_admin"
    # FUTURE SERVICE - Terminal microservice
    # Uncomment when activating terminal service:
    # "kodi_terminal"
)

echo "========================================="
echo "KODI Microservices - Database Setup"
echo "========================================="
echo ""

# =========================================
# Create 'postgres' role for compatibility
# =========================================
# Many database tools (pgAdmin, DBeaver, monitoring exporters) expect a 'postgres'
# superuser to exist. This creates it if the primary user is different.
if [ "$POSTGRES_USER" != "postgres" ]; then
    echo "Creating 'postgres' role for tool compatibility..."
    if ! psql -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = 'postgres'" | grep -q 1; then
        psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-EOSQL
            CREATE ROLE postgres WITH
                LOGIN
                SUPERUSER
                CREATEDB
                CREATEROLE
                INHERIT
                REPLICATION
                CONNECTION LIMIT -1
                PASSWORD '${POSTGRES_PASSWORD:-changeme}';
EOSQL
        echo "  ✓ Role 'postgres' created successfully (password same as primary user)"
    else
        echo "  ✓ Role 'postgres' already exists, skipping..."
    fi
    echo ""
fi

# Ensure default database exists (from POSTGRES_DB env var, or create kodi_db as fallback)
DEFAULT_DB="${POSTGRES_DB:-kodi_db}"
if ! psql -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DEFAULT_DB'" | grep -q 1; then
    echo "Creating default database: $DEFAULT_DB..."
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-EOSQL
        CREATE DATABASE $DEFAULT_DB;
EOSQL
    echo "  ✓ Default database '$DEFAULT_DB' created successfully"
    echo ""
fi

# Create database matching username to prevent connection errors
# (PostgreSQL defaults to username as database name when not specified)
if [ "$POSTGRES_USER" != "postgres" ] && ! psql -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_USER'" | grep -q 1; then
    echo "Creating user database: $POSTGRES_USER (for default connections)..."
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-EOSQL
        CREATE DATABASE "$POSTGRES_USER";
EOSQL
    echo "  ✓ User database '$POSTGRES_USER' created successfully"
    echo ""
fi

# Create each database if it doesn't exist
for DB_NAME in "${DATABASES[@]}"; do
    echo "Creating database: $DB_NAME..."

    # Check if database exists (connect to postgres database)
    if psql -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
        echo "  ✓ Database '$DB_NAME' already exists, skipping..."
    else
        psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-EOSQL
            CREATE DATABASE $DB_NAME;
            COMMENT ON DATABASE $DB_NAME IS 'Database for KODI microservice';
EOSQL
        echo "  ✓ Database '$DB_NAME' created successfully"
    fi
done

echo ""
echo "========================================="
echo "All databases initialized successfully!"
echo "========================================="
echo ""

# List created databases
echo "Available databases:"
psql -U "$POSTGRES_USER" -d postgres -c "\l kodi_*"
