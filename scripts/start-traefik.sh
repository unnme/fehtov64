#!/usr/bin/env bash

set -e

# Load variables from .env file if it exists
if [ -f .env ]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
fi

# Generate HASHED_PASSWORD if TRAEFIK_PASSWORD is set
if [ -n "$TRAEFIK_PASSWORD" ] && [ -z "$HASHED_PASSWORD" ]; then
    echo "🔐 Generating HASHED_PASSWORD from TRAEFIK_PASSWORD..."
    HASHED_PASSWORD=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    export HASHED_PASSWORD
    echo "✅ HASHED_PASSWORD generated"
fi

# Validate required variables
if [ -z "$USERNAME" ]; then
    echo "❌ Error: USERNAME is not set"
    echo "   Set USERNAME in .env file or export: export USERNAME=admin"
    exit 1
fi

if [ -z "$HASHED_PASSWORD" ]; then
    echo "❌ Error: HASHED_PASSWORD is not set"
    echo "   Set TRAEFIK_PASSWORD in .env file (HASHED_PASSWORD will be auto-generated)"
    echo "   Or set HASHED_PASSWORD directly: export HASHED_PASSWORD=\$(openssl passwd -apr1 your-password)"
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: DOMAIN is not set"
    echo "   Set DOMAIN in .env file or export: export DOMAIN=example.com"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo "❌ Error: EMAIL is not set"
    echo "   Set EMAIL in .env file or export: export EMAIL=admin@example.com"
    exit 1
fi

echo "🚀 Starting Traefik with:"
echo "   USERNAME: $USERNAME"
echo "   DOMAIN: $DOMAIN"
echo "   EMAIL: $EMAIL"
echo ""

# Create traefik-public network if it doesn't exist
docker network create traefik-public 2>/dev/null || true

# Start docker-compose
docker compose -f docker-compose.traefik.yml up -d --build "$@"
