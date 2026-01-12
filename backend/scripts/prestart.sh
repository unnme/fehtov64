#!/usr/bin/env bash

set -e
set -x

echo "🚀 Starting prestart script..."

echo "⏳ Waiting for database to be ready..."
python app/backend_pre_start.py

echo "🔄 Running database migrations..."
alembic upgrade head

echo "📦 Creating initial data..."
python app/initial_data.py

echo "✅ Prestart script completed successfully!"
