#!/usr/bin/env bash

set -e

# Загружаем переменные из .env файла, если он существует
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Если PASSWORD установлен, но HASHED_PASSWORD нет - генерируем автоматически
if [ -n "$TRAEFIK_PASSWORD" ] && [ -z "$HASHED_PASSWORD" ]; then
    echo "🔐 Генерирую HASHED_PASSWORD из TRAEFIK_PASSWORD..."
    export HASHED_PASSWORD=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    echo "✅ HASHED_PASSWORD сгенерирован"
fi

# Проверяем обязательные переменные
if [ -z "$USERNAME" ]; then
    echo "❌ Ошибка: USERNAME не установлен"
    echo "   Установите USERNAME в .env файле или экспортируйте: export USERNAME=admin"
    exit 1
fi

if [ -z "$HASHED_PASSWORD" ]; then
    echo "❌ Ошибка: HASHED_PASSWORD не установлен"
    echo "   Установите TRAEFIK_PASSWORD в .env файле (HASHED_PASSWORD будет сгенерирован автоматически)"
    echo "   Или установите HASHED_PASSWORD напрямую: export HASHED_PASSWORD=\$(openssl passwd -apr1 your-password)"
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ Ошибка: DOMAIN не установлен"
    echo "   Установите DOMAIN в .env файле или экспортируйте: export DOMAIN=localhost"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo "❌ Ошибка: EMAIL не установлен"
    echo "   Установите EMAIL в .env файле или экспортируйте: export EMAIL=admin@example.com"
    exit 1
fi

echo "🚀 Запускаю Traefik с переменными:"
echo "   USERNAME: $USERNAME"
echo "   DOMAIN: $DOMAIN"
echo "   EMAIL: $EMAIL"
echo ""

# Запускаем docker-compose
docker compose -f docker-compose.traefik.yml up -d --build "$@"

