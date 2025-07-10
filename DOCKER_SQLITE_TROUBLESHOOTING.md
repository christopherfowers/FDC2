# Docker SQLite Troubleshooting Guide

## Current Issue
SQLite database can't be created at `/app/data/mortar.db` in Docker container.

## Your Docker Compose Setup
```yaml
volumes:
  - ./fdc2-data:/app/data
```

## Solutions to Try

### 1. **Ensure Host Directory Exists** ⭐ (Most Likely Fix)
On your Docker host, create the directory before starting:

```bash
# Linux/Mac
mkdir -p ./fdc2-data
chmod 755 ./fdc2-data

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path ".\fdc2-data"
```

Or use the provided setup scripts:
- Linux/Mac: `./setup-docker.sh`
- Windows: `setup-docker.bat`

### 2. **Check Current State**
```bash
# Check if directory exists on host
ls -la ./fdc2-data

# Check Docker container logs
docker-compose logs fdc

# Connect to running container to debug
docker exec -it fdc ls -la /app/data
docker exec -it fdc whoami
```

### 3. **Alternative: Use Named Volume**
If host directory continues to fail, use a Docker named volume:

```yaml
volumes:
  - fdc2_data:/app/data

volumes:
  fdc2_data:
```

### 4. **Fallback Environment Variable**
Add to your docker-compose.yml:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - DATABASE_PATH=/tmp/mortar.db  # Fallback path
```

### 5. **Debug Container Permissions**
```bash
# Check what's happening inside container
docker exec -it fdc sh

# Inside container:
whoami                    # Should be 'nodejs'
id                       # Check user ID (should be 1001)
ls -la /app              # Check app directory
ls -la /app/data         # Check data directory
touch /app/data/test.txt # Test write permissions
```

### 6. **Current Database Behavior**
The app now has automatic fallback:
1. Tries `/app/data/mortar.db` (your volume mount)
2. If that fails, falls back to `/tmp/mortar.db` (temporary)
3. Logs detailed debug information

## Expected Log Output (Success)
```
🎯 FDC2 Database Initialization
📊 NODE_ENV: production
📁 Target database path: /app/data/mortar.db
📁 Database directory already exists: /app/data
✅ Database directory is writable: /app/data
📊 Using database at: /app/data/mortar.db
✅ Database connection established
```

## If Still Failing
The app will automatically use `/tmp/mortar.db` as fallback, but data won't persist between container restarts.

1. Check the logs for the exact error
2. Verify the `./fdc2-data` directory exists on your host
3. Try the named volume approach instead
4. Contact for further debugging with full log output
