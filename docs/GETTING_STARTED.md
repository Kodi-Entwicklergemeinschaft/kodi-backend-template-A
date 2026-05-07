# Getting Started with KODI Microservices

This guide will help you get the KODI microservices platform up and running in under 5 minutes.

## Prerequisites Check

Before starting, ensure you have:

```bash
# Check Node.js version (should be >= 24.11.0)
node --version

# Check Yarn (should be >= 1.22.0)
yarn --version

# Check Docker
docker --version
docker compose version
```

If any are missing, install them:

- **Node.js**: https://nodejs.org/ (use LTS version 24.x)
- **Yarn**: `npm install -g yarn`
- **Docker**: https://docs.docker.com/get-docker/

## 3-Minute Setup

### 1. Install Dependencies (1 min)

```bash
# Install all dependencies and generate Prisma client
yarn bootstrap
```

### 2. Configure Environment (30 sec)

```bash
# Copy the environment template
cp .env.example .env

# The defaults work for local development!
# For production, you MUST change JWT secrets
```

### 3. Start Infrastructure (1 min)

```bash
# Start PostgreSQL, Redis, and RabbitMQ
docker compose -f docker-compose.dev.yml up -d postgres redis rabbitmq

# Wait for services to initialize
sleep 15

# Run database migrations
yarn prisma:migrate
```

### 4. Start Services (30 sec)

Choose one option:

**Option A: All services at once (easiest)**

```bash
yarn dev
```

**Option B: Specific services**

```bash
# In separate terminals:
yarn dev:auth
yarn dev:terminal
# ... etc
```

**Option C: Everything in Docker**

```bash
docker compose -f docker-compose.dev.yml up
```

## Verify Installation

### Check Services

Open these URLs in your browser:

- Auth Service: http://localhost:3001/healthz
- Users Service: http://localhost:3002/healthz
- City Service: http://localhost:3003/healthz
- Core Service: http://localhost:3004/healthz
- Notification Service: http://localhost:3005/healthz
- Scheduler Service: http://localhost:3006/healthz
- Integration Service: http://localhost:3007/healthz

All should return `{"status":"ok",...}`

### Check Metrics

View Prometheus metrics:

- http://localhost:3001/metrics

### Check Infrastructure

```bash
# PostgreSQL
docker exec -it kodi-postgres-dev psql -U kodi -d kodi_db -c "SELECT 1;"

# Redis
docker exec -it kodi-redis-dev redis-cli ping

# RabbitMQ Management UI
# Open http://localhost:15672
# Login: kodi / kodi_password
```

## Your First API Call

### 1. Register a User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Save the `accessToken` from the response.

### 2. Use the Token

```bash
# Replace YOUR_TOKEN_HERE with the actual token
TOKEN="YOUR_TOKEN_HERE"

# Validate your token
curl -X POST http://localhost:3001/auth/validate \
  -H "Authorization: Bearer $TOKEN"

# Get all users
curl http://localhost:3002/users \
  -H "Authorization: Bearer $TOKEN"
```

## Development Tips

### Hot Reload

All services support hot reload. Just edit any `.ts` file and see changes instantly!

### Database GUI

Open Prisma Studio for a visual database editor:

```bash
yarn prisma:studio
```

Visit http://localhost:5555

### View Logs

```bash
# Docker logs
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f postgres
```

### Reset Database

```bash
# ⚠️ This deletes all data!
npx prisma migrate reset
```

## Common Issues

### Port Already in Use

```bash
# Find what's using the port (e.g., 3001)
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Docker Won't Start

```bash
# Reset Docker
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
yarn prisma:generate
```

### Node Modules Issues

```bash
# Nuclear option - reinstall everything
rm -rf node_modules apps/*/node_modules libs/*/node_modules dist
yarn install
yarn prisma:generate
```

## Next Steps

Now that everything is running:

1. **Explore the API**: Check `README.md` for more API examples
2. **Read the Code**: Start with `apps/auth/src/modules/auth/auth.service.ts`
3. **Try the Services**: Create cities, send notifications, schedule tasks
4. **Modify Something**: Add a new endpoint or field
5. **Run Tests**: `yarn test:all`

## Getting Help

- **Documentation**: See `README.md` for detailed information
- **Troubleshooting**: Check the troubleshooting section in `README.md`
- **API Docs**: Coming soon (add Swagger/OpenAPI)

## What You Just Built

You now have:

- ✅ 7 microservices running
- ✅ PostgreSQL database with migrations
- ✅ Redis caching layer
- ✅ RabbitMQ message queue
- ✅ JWT authentication
- ✅ Prometheus metrics
- ✅ Health checks
- ✅ Hot reload for development
- ✅ Docker containerization

**Happy coding!** 🚀
