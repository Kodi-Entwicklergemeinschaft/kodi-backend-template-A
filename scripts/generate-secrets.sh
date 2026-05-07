#!/bin/bash

# KODI Microservices - Generate Secure Secrets
# This script generates random secrets for JWT and other sensitive configurations

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KODI Microservices - Secret Generator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to generate a random secret
generate_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    elif command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    else
        echo "Error: Neither openssl nor node is available" >&2
        exit 1
    fi
}

echo -e "${BLUE}Generating secure random secrets...${NC}"
echo ""

# Generate JWT Secret
JWT_SECRET=$(generate_secret)
echo -e "${GREEN}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""

# Generate JWT Refresh Secret
JWT_REFRESH_SECRET=$(generate_secret)
echo -e "${GREEN}JWT_REFRESH_SECRET:${NC}"
echo "$JWT_REFRESH_SECRET"
echo ""

# Generate PostgreSQL Password
POSTGRES_PASSWORD=$(generate_secret | cut -c1-24)
echo -e "${GREEN}POSTGRES_PASSWORD (24 chars):${NC}"
echo "$POSTGRES_PASSWORD"
echo ""

# Generate RabbitMQ Password
RABBITMQ_PASSWORD=$(generate_secret | cut -c1-24)
echo -e "${GREEN}RABBITMQ_PASSWORD (24 chars):${NC}"
echo "$RABBITMQ_PASSWORD"
echo ""

# Generate Redis Password (if needed)
REDIS_PASSWORD=$(generate_secret | cut -c1-24)
echo -e "${GREEN}REDIS_PASSWORD (24 chars):${NC}"
echo "$REDIS_PASSWORD"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}⚠ IMPORTANT: Copy these secrets to your .env file${NC}"
echo -e "${YELLOW}⚠ Store them securely and never commit to version control${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Optionally update .env file
read -p "$(echo -e ${YELLOW}Do you want to automatically update .env with these secrets? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠ .env file not found. Run ./scripts/setup-env.sh first${NC}"
        exit 1
    fi

    echo -e "${BLUE}Updating .env file...${NC}"

    # Create backup
    cp .env .env.backup
    echo -e "${GREEN}✓ Created backup: .env.backup${NC}"

    # Update secrets
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    sed -i "s|^RABBITMQ_PASSWORD=.*|RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD|" .env
    sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|" .env

    # Update DATABASE_URLs with new password
    sed -i "s|postgresql://kodi:[^@]*@|postgresql://kodi:$POSTGRES_PASSWORD@|g" .env
    sed -i "s|amqp://kodi:[^@]*@|amqp://kodi:$RABBITMQ_PASSWORD@|g" .env

    # Update REDIS_URL with password if password is set (format: redis://:password@host:port)
    if [ -n "$REDIS_PASSWORD" ]; then
        sed -i "s|^REDIS_URL=redis://[^@]*@localhost:6379|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|" .env
        sed -i "s|^REDIS_URL=redis://localhost:6379|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|" .env
    fi

    echo -e "${GREEN}✓ Updated .env with new secrets${NC}"
    echo -e "${YELLOW}⚠ Remember to update your docker-compose files with the new passwords${NC}"
else
    echo -e "${BLUE}Skipped automatic update. Copy the secrets manually.${NC}"
fi

echo ""
