# KODI Microservices - Makefile
# Convenience commands for common development tasks

.PHONY: help install dev build test clean docker-up docker-down migrate

# Default target
help:
	@echo "KODI Microservices - Available Commands:"
	@echo ""
	@echo "  make install      - Install dependencies and setup"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make build        - Build all services"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linter"
	@echo "  make clean        - Clean build artifacts and dependencies"
	@echo ""
	@echo "  make docker-up    - Start all Docker services (dev)"
	@echo "  make docker-down  - Stop all Docker services"
	@echo "  make docker-logs  - View Docker logs"
	@echo ""
	@echo "  make migrate      - Run database migrations"
	@echo "  make prisma       - Open Prisma Studio"
	@echo ""
	@echo "  make reset        - Reset everything (⚠️  deletes data)"

# Installation
install:
	@echo "📦 Installing dependencies..."
	yarn install
	@echo "🔄 Generating Prisma client..."
	yarn prisma:generate
	@echo "✅ Installation complete!"

# Development
dev:
	@echo "🚀 Starting all services in development mode..."
	yarn dev

dev-auth:
	@echo "🚀 Starting auth service..."
	yarn dev:auth

dev-users:
	@echo "🚀 Starting users service..."
	yarn dev:terminal

# Build
build:
	@echo "🔨 Building all services..."
	yarn build

# Testing
test:
	@echo "🧪 Running all tests..."
	yarn test

test-watch:
	@echo "🧪 Running tests in watch mode..."
	yarn test:watch

test-cov:
	@echo "🧪 Running tests with coverage..."
	yarn test:cov

# Linting
lint:
	@echo "🔍 Running linter..."
	yarn lint

format:
	@echo "💅 Formatting code..."
	yarn format

# Clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf coverage
	@echo "✅ Clean complete!"

clean-all: clean
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf libs/*/node_modules
	@echo "✅ Deep clean complete!"

# Docker
docker-up:
	@echo "🐳 Starting Docker services (development)..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for services to be ready..."
	sleep 10
	@echo "✅ Docker services are running!"

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker compose -f docker-compose.dev.yml down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker compose -f docker-compose.dev.yml logs -f

docker-ps:
	@echo "📊 Docker service status..."
	docker compose -f docker-compose.dev.yml ps

docker-restart:
	@echo "🔄 Restarting Docker services..."
	docker compose -f docker-compose.dev.yml restart

# Production Docker
docker-prod-build:
	@echo "🐳 Building production images..."
	docker compose build

docker-prod-up:
	@echo "🐳 Starting production environment..."
	docker compose up -d

docker-prod-down:
	@echo "🐳 Stopping production environment..."
	docker compose down

# Database
migrate:
	@echo "🗄️  Running database migrations..."
	yarn prisma:migrate

migrate-all:
	@echo "🗄️  Running migrations for all services..."
	yes | ./scripts/prisma-migrate-all.sh

migrate-auth:
	@echo "🗄️  Running migrations for auth..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/auth/schema.prisma

migrate-users:
	@echo "🗄️  Running migrations for users..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/users/schema.prisma

migrate-city:
	@echo "🗄️  Running migrations for city..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/city/schema.prisma

migrate-core:
	@echo "🗄️  Running migrations for core..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/core/schema.prisma

migrate-notification:
	@echo "🗄️  Running migrations for notification..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/notification/schema.prisma

migrate-scheduler:
	@echo "🗄️  Running migrations for scheduler..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/scheduler/schema.prisma

migrate-integration:
	@echo "🗄️  Running migrations for integration..."
	npx prisma migrate dev --schema=libs/prisma/src/schemas/integration/schema.prisma

migrate-prod:
	@echo "🗄️  Deploying migrations to production..."
	yarn prisma:migrate:prod

prisma:
	@echo "🎨 Opening Prisma Studio..."
	yarn prisma:studio

db-reset:
	@echo "⚠️  Resetting database (this will delete all data)..."
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	npx prisma migrate reset

# Complete setup
setup: install docker-up
	@echo "⏳ Waiting for database..."
	sleep 15
	@$(MAKE) migrate
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "You can now run: make dev"
	@echo ""

# Reset everything
reset: docker-down clean-all
	@echo "⚠️  Removing Docker volumes..."
	docker compose -f docker-compose.dev.yml down -v
	@echo "✅ Reset complete!"
	@echo "Run 'make setup' to start fresh."

# Quick start
start: docker-up dev

# Stop everything
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "nest start" || true
	@$(MAKE) docker-down
	@echo "✅ All services stopped!"

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3001/healthz || echo "❌ Auth service is down"
	@curl -s http://localhost:3002/healthz || echo "❌ Users service is down"
	@curl -s http://localhost:3003/healthz || echo "❌ City service is down"
	@curl -s http://localhost:3004/healthz || echo "❌ Core service is down"
	@curl -s http://localhost:3005/healthz || echo "❌ Notification service is down"
	@curl -s http://localhost:3006/healthz || echo "❌ Scheduler service is down"
	@curl -s http://localhost:3007/healthz || echo "❌ Integration service is down"

# Logs
logs-auth:
	yarn dev:auth

logs-docker:
	docker compose -f docker-compose.dev.yml logs -f
