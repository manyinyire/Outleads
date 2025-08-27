#!/bin/bash

# Docker Deployment Script for Outleads
# Usage: ./docker-deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-prod}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

echo "🚀 Deploying Outleads in $ENVIRONMENT mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p docker/ssl
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f .env.docker ]; then
        echo "📋 Copying .env.docker to .env.local..."
        cp .env.docker .env.local
        echo "⚠️  Please update .env.local with your actual values before running again!"
        exit 1
    else
        echo "❌ No environment file found. Please create .env.local with your configuration."
        exit 1
    fi
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE down --remove-orphans
docker-compose -f $COMPOSE_FILE build --no-cache
docker-compose -f $COMPOSE_FILE up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy

# Seed database if in development
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🌱 Seeding database..."
    docker-compose -f $COMPOSE_FILE exec app npm run db:seed
fi

# Show status
echo "📊 Service status:"
docker-compose -f $COMPOSE_FILE ps

echo "✅ Deployment complete!"
echo "🌐 Application available at: http://localhost:3000"
echo "📊 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop services: docker-compose -f $COMPOSE_FILE down"
