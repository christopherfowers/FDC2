#!/bin/bash

# FDC2 Docker Setup Script
# This script verifies Docker setup for the static FDC application

echo "🎯 Setting up FDC2 Docker environment..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  docker-compose.yml not found in current directory"
    echo "Make sure you're running this script in the same directory as your docker-compose.yml"
    exit 1
else
    echo "✅ docker-compose.yml found"
fi

echo "🐳 Ready to run: docker-compose up --build"
echo "📊 Application will serve CSV data as static assets"
echo ""
echo "🌐 FDC2 Static Site will be available at: http://localhost:3002"
echo ""
echo "To start FDC2:"
echo "  docker-compose up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f fdc2-app"
echo ""
echo "To stop:"
echo "  docker-compose down"
