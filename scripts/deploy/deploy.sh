#!/bin/bash

# Fire Direction Calculator - Quick Deployment Script

set -e

# Get the project root directory (two levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🎯 Fire Direction Calculator - Docker Deployment"
echo "================================================"

# Parse command line arguments
ENVIRONMENT=${1:-production}
PORT=${2:-80}

if [ "$ENVIRONMENT" = "development" ]; then
    PORT=3002
    COMPOSE_FILE="docker/docker-compose.yml"
    echo "🧑‍💻 Deploying in DEVELOPMENT mode"
else
    COMPOSE_FILE="docker/docker-compose.prod.yml"
    echo "🚀 Deploying in PRODUCTION mode"
fi

echo "📦 Building Docker image..."
docker-compose -f $COMPOSE_FILE build

echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

echo "🚀 Starting FDC2 application..."
docker-compose -f $COMPOSE_FILE up -d

echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🔍 Running health check..."
if curl -f "http://localhost:$PORT/" > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
    echo ""
    echo "🎯 Fire Direction Calculator is now running!"
    echo "🌐 Access the application at: http://localhost:$PORT"
    echo " Static CSV data available at: http://localhost:$PORT/data/"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "   Stop app:  docker-compose -f $COMPOSE_FILE down"
    echo "   Restart:   docker-compose -f $COMPOSE_FILE restart"
else
    echo "❌ Health check failed. Check logs with:"
    echo "   docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi
