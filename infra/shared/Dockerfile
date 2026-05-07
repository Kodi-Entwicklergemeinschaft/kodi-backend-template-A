# Multi-stage Dockerfile for NestJS microservices
# Optimized for production with minimal image size and better layer caching
# Usage: docker build --build-arg APP_NAME=auth -t kodi-auth -f infra/shared/Dockerfile .

ARG NODE_VERSION=24.11.0

# Stage 1: Base image with minimal runtime dependencies
FROM node:${NODE_VERSION}-alpine AS base

# Install essential runtime dependencies
# OpenSSL is required for Prisma Client at runtime
RUN apk add --no-cache dumb-init curl openssl libc6-compat ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Stage 2: Dependencies installation (shared layer for better caching)
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install production dependencies only
# npm ci is faster and more reliable than npm install for Docker builds
# Using --legacy-peer-deps to match Yarn's peer dependency handling
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Stage 3: Build stage
FROM base AS build

# Build argument for service name - declared early for layer caching
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Install build dependencies
# Prisma requires openssl, libc6-compat (glibc compatibility), and ca-certificates
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    openssl \
    libc6-compat \
    ca-certificates

# Copy package files
COPY package.json package-lock.json* ./
COPY tsconfig.json nest-cli.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy all Prisma schemas (required because shared libs use barrel exports)
# The @kodi/prisma barrel export resolves all Prisma services at build time
COPY libs/prisma/src/schemas/ ./libs/prisma/src/schemas/

# Generate ALL Prisma clients (required due to barrel exports in @kodi/prisma and @kodi/rbac)
# Each service's build resolves the entire @kodi/prisma module which imports all clients
RUN for schema in libs/prisma/src/schemas/*/schema.prisma; do \
      echo "Generating Prisma client for: $schema"; \
      npx prisma generate --schema="$schema"; \
    done

# Copy the rest of libs (Prisma modules, aliases, services, other shared libs)
COPY libs/ ./libs/

# Copy source code for apps
COPY apps/ ./apps/

# Build the specific app
RUN npm run build:${APP_NAME}

# Clean up build dependencies
RUN apk del .build-deps

# Stage 4: Production runtime (minimal image)
FROM base AS production

WORKDIR /app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

# Copy only production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist/apps/${APP_NAME} ./dist

# Copy Prisma generated client for this service (required at runtime)
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schemas (may be needed at runtime for migrations)
COPY --from=build --chown=nestjs:nodejs /app/libs/prisma/src/schemas/ ./libs/prisma/src/schemas/

# Copy i18n translation files (required for response message translations)
COPY --from=build --chown=nestjs:nodejs /app/libs/i18n/src/translations/ ./libs/i18n/src/translations/

# Create logs directory
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

USER nestjs

# Health check (uses default port, actual port comes from SERVICE_PORT env var)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.SERVICE_PORT || '3000') + '/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
