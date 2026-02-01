#!/usr/bin/env bash

set -e

# Load variables from .env.production
if [ -f .env.production ]; then
    set -a
    # shellcheck source=/dev/null
    source .env.production
    set +a
else
    echo "❌ File .env.production not found"
    echo "   Copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Validate required variables
REQUIRED_VARS=(
    "DOMAIN"
    "SECRET_KEY"
    "POSTGRES_PASSWORD"
    "FIRST_SUPERUSER"
    "FIRST_SUPERUSER_PASSWORD"
    "USERNAME"
    "EMAIL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required variable $var is not set"
        exit 1
    fi
done

# Check for default passwords
if [ "$SECRET_KEY" = "changethis" ] || [ "$SECRET_KEY" = "changethis-in-production" ]; then
    echo "❌ SECRET_KEY must be changed from default value"
    exit 1
fi

if [ "$POSTGRES_PASSWORD" = "changethis" ]; then
    echo "❌ POSTGRES_PASSWORD must be changed from default value"
    exit 1
fi

if [ "$FIRST_SUPERUSER_PASSWORD" = "changethis" ]; then
    echo "❌ FIRST_SUPERUSER_PASSWORD must be changed from default value"
    exit 1
fi

# Generate HASHED_PASSWORD if needed
if [ -n "$TRAEFIK_PASSWORD" ] && [ -z "$HASHED_PASSWORD" ]; then
    echo "🔐 Generating HASHED_PASSWORD from TRAEFIK_PASSWORD..."
    HASHED_PASSWORD=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    export HASHED_PASSWORD
    echo "✅ HASHED_PASSWORD generated"
fi

if [ -z "$HASHED_PASSWORD" ]; then
    echo "❌ HASHED_PASSWORD or TRAEFIK_PASSWORD must be set"
    exit 1
fi

echo "🚀 Starting production environment:"
echo "   ENVIRONMENT: $ENVIRONMENT"
echo "   DOMAIN: $DOMAIN"
echo "   STACK_NAME: $STACK_NAME"
echo ""

# Create traefik-public network if it doesn't exist
echo "📦 Checking traefik-public network..."
docker network create traefik-public 2>/dev/null || echo "   traefik-public network already exists"

# Start Traefik (production with HTTPS/Let's Encrypt)
echo "📦 Starting Traefik..."
docker compose -f docker-compose.traefik.yml up -d --build

# Small pause for Traefik to start
sleep 3

# Start project
echo "📦 Starting project in production mode..."
docker compose -f docker-compose.yml --env-file .env.production --profile backup up -d --build

echo ""
echo "✅ Production environment started!"
echo ""
echo "Available URLs:"
echo "  - Frontend Dashboard: https://dashboard.$DOMAIN"
echo "  - Main Site: https://$DOMAIN"
echo "  - Backend API: https://api.$DOMAIN"
echo "  - API Docs: https://api.$DOMAIN/docs"
echo "  - Traefik Dashboard: https://traefik.$DOMAIN"
echo ""
echo "⚠️  Make sure DNS records point to this server!"
