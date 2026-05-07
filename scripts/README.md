# KODI Microservices - Scripts

This directory contains helper scripts for setting up and managing the KODI microservices platform.

## 📋 Available Scripts

### 📁 Script Organization

- **General scripts** (`scripts/`): Application-level scripts for development and operations
- **Infrastructure scripts** (`infra/`): Infrastructure-specific configuration and initialization
  - `infra/postgres/init-databases.sh` - Auto-creates databases on Docker container startup
  - `infra/rabbitmq/` - RabbitMQ configuration
  - `infra/prometheus/` - Prometheus configuration
  - `infra/nginx/` - Nginx configuration
  - etc.

### 🗃️ Prisma & Database Migration Scripts

#### `prisma-generate-all.sh`

Generate Prisma clients for all microservices.

**Usage:**

```bash
./scripts/prisma-generate-all.sh
```

**What it does:**

- Generates Prisma clients for all 8 microservices (auth, users, city, core, notification, scheduler, integration, admin)
- Each client is generated to a separate output directory in `node_modules/.prisma/client-<service>`
- Must be run after any schema changes

**When to use:**

- After modifying any Prisma schema
- After initial project setup
- Before running migrations

---

#### `prisma-migrate-all.sh`

Run database migrations for all microservice databases in development.

**Usage:**

```bash
./scripts/prisma-migrate-all.sh
```

**What it does:**

- Applies schema migrations to all microservice databases
- Creates migration files in each Prisma library
- Interactive - asks for confirmation before proceeding

**Prerequisites:**

- PostgreSQL server must be running
- All databases must exist (created automatically by Docker via `infra/postgres/init-databases.sh`)
- `.env` file must contain all `*_DATABASE_URL` variables

**When to use:**

- After schema changes in development
- Initial database setup

---

#### `prisma-migrate-prod.sh`

Deploy migrations to production for all microservice databases.

**Usage:**

```bash
./scripts/prisma-migrate-prod.sh
```

**What it does:**

- Deploys existing migration files to production databases
- Non-interactive (for CI/CD pipelines)
- Fails fast if any migration fails

**Prerequisites:**

- All migrations must already exist in `libs/prisma-*/prisma/migrations/`
- Production database URLs must be set in environment

**When to use:**

- Production deployments
- CI/CD pipelines

---

### 🔧 `setup-env.sh`

Creates `.env` and `.env.example` files with all required environment variables.

**Usage:**

```bash
./scripts/setup-env.sh
```

**What it does:**

- Creates `.env.example` template file
- Creates `.env` file (if it doesn't exist)
- Sets up all environment variables with default values

**After running:**

- Edit `.env` with your actual values
- Change JWT secrets to secure random values
- Update database credentials if needed

---

### 🔐 `generate-secrets.sh`

Generates cryptographically secure random secrets for JWT and other sensitive configurations.

**Usage:**

```bash
./scripts/generate-secrets.sh
```

**What it generates:**

- `JWT_SECRET` (64 hex characters)
- `JWT_REFRESH_SECRET` (64 hex characters)
- `POSTGRES_PASSWORD` (24 characters)
- `RABBITMQ_PASSWORD` (24 characters)
- `REDIS_PASSWORD` (24 characters)

**Options:**

- Interactive mode: Prompts to automatically update `.env` file
- Manual mode: Copy secrets manually to `.env`

**Important:**

- Always generates new random secrets
- Creates backup (`.env.backup`) before updating
- Updates all DATABASE_URLs with new passwords

---

### 🌐 `seed-firebase-project.ts`

Seed or update a Firebase project configuration (per city or default Kodi app).

**Usage (via wrapper):**

```bash
./scripts/seed-wrapper.sh scripts/seed-firebase-project.ts \
  --cityId=15f0b1d4-4f6b-4ac7-b9f5-6e4c1c2c9c0b \
  --projectId=kodi-staging \
  --projectName="Kodi Staging" \
  --credentialsPath=./kodi-staging-firebase-adminsdk.json
```

**Options:**

- `--projectId` (required): Firebase project ID
- `--projectName` (required): Human-readable label
- `--credentialsPath` (required): Path to the service-account JSON file
- `--cityId`: City ID that should use this Firebase project (omit for default Kodi app)
- `--isDefault`: Mark this project as the Kodi default (cannot combine with `cityId`)
- `--metadata`: Optional JSON string with extra metadata, e.g. `--metadata='{"region":"europe-west1"}'`

The script encrypts credentials with `FCM_ENCRYPTION_KEY` (or fallback) before writing to the `firebase_projects` table.

### 🌱 `seed-all.sh`

Run every seed/upload script in the correct order to fully bootstrap a fresh environment.

**Usage:**

```bash
# Run the entire pipeline
npm run seed:all

# List pipeline steps without executing
npm run seed:all -- --list

# Skip optional integrations/assets
npm run seed:all -- --skip seed:destination-one,seed:firebase-project

# Run only a subset
npm run seed:all -- --only seed:terms,seed:initial-admin
```

**What it does:**

- Executes all `seed:*` and `upload:*` scripts via `seed-wrapper.sh`
- Ensures prerequisites (categories, assets, admins, integrations, etc.) run in dependency-safe order
- Stops immediately on the first failing step (so issues are obvious)
- Supports `SEED_BOOTSTRAP_SKIP` env var and `--skip/--only` flags for flexible pipelines

**When to use:**

- First boot of a new environment (local, staging, production)
- Automated bootstrap inside Docker/Helm entrypoints
- Bulk reseeding during QA/preview deployments

### 🚀 `init-production.sh`

Production initialization script for first-time setup.

**Usage:**

```bash
./scripts/init-production.sh
```

**What it does:**

- Validates environment configuration
- Generates Prisma clients
- Deploys database migrations
- Verifies setup completion

**Note:** Databases are created automatically by Docker via `infra/postgres/init-databases.sh` on first container startup.

**Prerequisites:**

- `.env` file with production values
- PostgreSQL server accessible
- Secure secrets (warns if using defaults)

**When to use:**

- First production deployment
- Setting up new production environment
- After infrastructure changes

---

## 🚀 Quick Start Guide

### Development Setup (Docker)

1. **Set up environment variables:**

   ```bash
   ./scripts/setup-env.sh
   ```

2. **Generate secure secrets:**

   ```bash
   ./scripts/generate-secrets.sh
   # Choose 'y' to automatically update .env
   ```

3. **Edit `.env` with your specific values:**

   ```bash
   nano .env
   # or
   code .env
   ```

4. **Start infrastructure (databases auto-created):**

   ```bash
   docker compose -f docker-compose.dev.yml up -d postgres redis rabbitmq
   # Databases are automatically created on first startup via infra/postgres/init-databases.sh
   ```

5. **Generate Prisma clients:**

   ```bash
   ./scripts/prisma-generate-all.sh
   ```

6. **Run Prisma migrations:**

   ```bash
   ./scripts/prisma-migrate-all.sh
   ```

### Development Setup (Local PostgreSQL)

If running PostgreSQL locally (not Docker):

1. **Set up environment variables** (same as above)
2. **Generate secure secrets** (same as above)
3. **Create databases manually:**

   ```bash
   # Connect to PostgreSQL and create databases
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_auth;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_users;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_city;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_core;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_notification;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_scheduler;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_integration;"
   psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_admin;"
   ```

4. **Generate Prisma clients and run migrations** (same as above)

### Production Initialization

For first-time production setup:

```bash
# 1. Set up .env with production values
./scripts/setup-env.sh
# Edit .env with production credentials

# 2. Generate secure production secrets
./scripts/generate-secrets.sh

# 3. Run production initialization (creates DBs, generates clients, deploys migrations)
./scripts/init-production.sh
```

---

## 🔄 Common Workflows

### Reset Environment

```bash
# Backup current .env
cp .env .env.old

# Create fresh environment
./scripts/setup-env.sh

# Generate new secrets
./scripts/generate-secrets.sh

# Recreate databases (drops existing!)
# WARNING: This will delete all data
psql -h localhost -U kodi -c "DROP DATABASE IF EXISTS kodi_auth;"
psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_auth;"
# Repeat for other databases as needed
```

### Update Secrets Only

```bash
# Generate and update secrets
./scripts/generate-secrets.sh
# Choose 'y' when prompted

# Update docker-compose with new passwords
# Edit docker-compose.dev.yml and docker-compose.yml manually
```

### Verify Setup

```bash
# Check .env file exists
ls -la .env

# Check databases exist
psql -h localhost -U kodi -l | grep kodi_

# Test database connections
psql -h localhost -U kodi -d kodi_auth -c "SELECT 1;"
```

---

## 🛠️ Troubleshooting

### Script Permission Denied

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### PostgreSQL Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres
# or
pg_isready -h localhost

# Check credentials in .env
grep POSTGRES .env

# Test connection manually
psql -h localhost -U kodi -d postgres
```

### .env File Not Found

```bash
# Run setup script first
./scripts/setup-env.sh

# Or copy from template
cp env.template .env
```

### Database Already Exists

Databases are created automatically on first Docker container startup. To recreate:

```bash
# Drop database (WARNING: Deletes all data!)
psql -h localhost -U kodi -d postgres -c "DROP DATABASE IF EXISTS kodi_auth;"

# Recreate
psql -h localhost -U kodi -d postgres -c "CREATE DATABASE kodi_auth;"
# Repeat for other databases as needed
```

---

## 📝 Environment Variables

All scripts read from `.env` file. Key variables:

```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=kodi
POSTGRES_PASSWORD=kodi_password

# Per-service databases
AUTH_DATABASE_URL=postgresql://kodi:pass@localhost:5432/kodi_auth
USERS_DATABASE_URL=postgresql://kodi:pass@localhost:5432/kodi_users
# ... etc

# Security
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

See `docs/ENVIRONMENT_VARIABLES.md` for complete documentation.

---

## 🔒 Security Best Practices

1. **Never commit `.env` to version control**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Always use strong secrets in production**
   - Use `generate-secrets.sh` script
   - Minimum 32 characters for JWT secrets

3. **Rotate secrets regularly**
   - Generate new secrets quarterly
   - Update all services simultaneously

4. **Backup `.env` files**
   - Store securely (password manager, vault)
   - Keep separate backup for production

5. **Use different credentials per environment**
   - Development, staging, production
   - Different database passwords
   - Different JWT secrets

---

## 📚 Additional Resources

- [Main README](../README.md)
- [Environment Variables Guide](../docs/ENVIRONMENT_VARIABLES.md)
- [TODO List](../TODO.md)
- [Getting Started Guide](../docs/GETTING_STARTED.md)

---

## 🏗️ Infrastructure Scripts

Infrastructure-specific scripts are located in the `infra/` directory:

- **PostgreSQL**: `infra/postgres/init-databases.sh` - Auto-creates databases on first container startup
- **RabbitMQ**: Configuration files in `infra/rabbitmq/`
- **Prometheus/Grafana**: Configuration files in `infra/prometheus/` and `infra/grafana/`
- **Nginx**: Configuration files in `infra/nginx/`

See individual README files in each infrastructure directory for details.

---

## 🔄 Development vs Production

### Development (Docker)

- **Auto-setup**: Databases created automatically via `infra/postgres/init-databases.sh`
- **Hot-reload**: Services run locally with file watching
- **Dev databases**: Separate volume (`postgres_data_dev`)

### Production

- **Manual setup**: Use `init-production.sh` for first-time initialization
- **Containerized**: All services run in Docker containers
- **Persistent volumes**: Production data volumes
- **Health checks**: All services have health checks and restart policies

---

**Last Updated:** 2025-01-02
