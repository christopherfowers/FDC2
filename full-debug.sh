#!/bin/bash

echo "🔍 FDC2 Database Debug Script"
echo "============================"

echo ""
echo "1. Checking Docker container status..."
if docker ps | grep -q fdc; then
    echo "✅ Container is running"
    
    echo ""
    echo "2. Container logs (last 30 lines):"
    echo "=================================="
    docker logs --tail=30 fdc
    
    echo ""
    echo "3. Database directory inside container:"
    echo "======================================"
    docker exec fdc ls -la /app/data
    
    echo ""
    echo "4. Database file check:"
    echo "======================"
    docker exec fdc ls -la /app/data/*.db 2>/dev/null || echo "❌ No .db files found in /app/data"
    
    echo ""
    echo "5. Test database directory write permissions:"
    echo "============================================="
    docker exec fdc whoami
    docker exec fdc touch /app/data/test-write.txt && echo "✅ Can write to /app/data" || echo "❌ Cannot write to /app/data"
    docker exec fdc rm -f /app/data/test-write.txt 2>/dev/null
    
    echo ""
    echo "6. Check CSV files in container:"
    echo "==============================="
    docker exec fdc ls -la /app/data/*.csv 2>/dev/null || echo "❌ No CSV files found in /app/data"
    
    echo ""
    echo "7. Process list in container:"
    echo "============================="
    docker exec fdc ps aux
    
else
    echo "❌ Container not running"
    echo ""
    echo "Recent container logs:"
    echo "====================="
    docker logs fdc 2>/dev/null || echo "No logs available"
fi

echo ""
echo "8. Host directory check:"
echo "========================"
echo "Current directory: $(pwd)"
echo "fdc2-data directory exists: $([ -d './fdc2-data' ] && echo 'YES' || echo 'NO')"
if [ -d './fdc2-data' ]; then
    echo "Contents of ./fdc2-data:"
    ls -la ./fdc2-data
fi
