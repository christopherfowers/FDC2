#!/bin/bash

# Get the project root directory (two levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🐳 FDC2 Docker Debug Script"
echo "=========================="

echo ""
echo "1. Checking host directory..."
if [ -d "./fdc2-data" ]; then
    echo "✅ ./fdc2-data directory exists"
    ls -la ./fdc2-data
else
    echo "❌ ./fdc2-data directory missing - creating it..."
    mkdir -p ./fdc2-data
    chmod 755 ./fdc2-data
    echo "✅ Created ./fdc2-data with 755 permissions"
fi

echo ""
echo "2. Checking Docker container..."
if docker ps | grep -q fdc; then
    echo "✅ FDC container is running"
    echo ""
    echo "3. Container debugging..."
    echo "User inside container:"
    docker exec fdc whoami
    
    echo ""
    echo "Directory listing inside container:"
    docker exec fdc ls -la /app/data
    
    echo ""
    echo "Testing write permissions inside container:"
    docker exec fdc touch /app/data/test-permissions.txt && echo "✅ Write test passed" || echo "❌ Write test failed"
    docker exec fdc rm -f /app/data/test-permissions.txt 2>/dev/null
    
else
    echo "❌ FDC container not running"
    echo "Run: docker-compose up -d"
fi

echo ""
echo "4. Container logs (last 20 lines):"
echo "=================================="
docker-compose logs --tail=20 fdc 2>/dev/null || echo "No logs available"
