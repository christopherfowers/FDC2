#!/bin/bash

# FDC2 Docker Setup Script
# This script verifies Docker setup for the static FDC application

# Get the project root directory (two levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🎯 Setting up FDC2 Docker environment..."

# Check if docker-compose.yml exists
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "⚠️  docker/docker-compose.yml not found"
    echo "Make sure the docker directory exists with docker-compose.yml"
    exit 1
else
    echo "✅ docker/docker-compose.yml found"
fi

echo "🐳 Ready to run: docker-compose -f docker/docker-compose.yml up --build"
echo "📊 Application will serve CSV data as static assets"
echo ""
echo "🌐 FDC2 Static Site will be available at: http://localhost:3002"
echo ""
echo "To start FDC2:"
echo "  docker-compose -f docker/docker-compose.yml up -d"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker/docker-compose.yml logs -f fdc2-app"
echo ""
echo "To stop:"
echo "  docker-compose -f docker/docker-compose.yml down"
