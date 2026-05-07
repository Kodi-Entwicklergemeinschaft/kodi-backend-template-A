# PostgreSQL Infrastructure Configuration

This directory contains PostgreSQL-specific configuration and initialization scripts.

## Files

- `init-databases.sh` - Auto-initialization script that runs on first container startup
  - Creates all 7 microservice databases automatically
  - Runs via Docker's `/docker-entrypoint-initdb.d/` mechanism
  - Only runs if the data directory is empty (first start)

## How It Works

When PostgreSQL container starts for the first time:

1. Docker runs all scripts in `/docker-entrypoint-initdb.d/`
2. `init-databases.sh` is executed
3. All required databases are created automatically
4. Subsequent container starts skip this (data already exists)

## Usage

The script is automatically mounted into the PostgreSQL container via docker-compose:

```yaml
volumes:
  - ./infra/postgres/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh:ro
```

No manual intervention required - databases are created on first startup.
