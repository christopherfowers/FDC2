# Docker Deployment Guide

This guide covers how to deploy the Fire Direction Calculator (FDC2) using Docker in a production environment.

## Overview

The application is containerized as a single Docker container that:
- Builds the React frontend into static files
- Serves the static files via Express.js
- Provides the API endpoints
- Includes the SQLite database with ballistic data

## Quick Start

### Development Build
```bash
# Build and run with development settings
npm run docker:build
npm run docker:run

# Or use docker-compose
docker-compose up --build
```

### Production Build
```bash
# Using docker-compose for production
docker-compose -f docker-compose.prod.yml up --build -d
```

## Manual Docker Commands

### Build the Image
```bash
docker build -t fdc2-app .
```

### Run the Container
```bash
# Development (port 3001)
docker run -p 3001:3001 --name fdc2-container fdc2-app

# Production (port 80)
docker run -p 80:3001 --name fdc2-production fdc2-app
```

### With Data Persistence
```bash
docker run -p 80:3001 -v fdc2-data:/app/data --name fdc2-production fdc2-app
```

## Docker Compose Options

### Development
```bash
docker-compose up --build
```
- Exposes on port 3001
- Suitable for local testing

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
- Exposes on port 80
- Includes resource limits
- Persistent data volume
- Runs in detached mode

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for production mode |
| `PORT` | `3001` | Port the server listens on |
| `VITE_API_URL` | `http://localhost:3001` | API base URL (empty in production) |

## Health Checks

The container includes health checks accessible at:
- `GET /health` - Returns server status

Docker health checks run every 30 seconds and verify the server is responding.

## Data Persistence

The SQLite database is stored in `/app/data/` inside the container. To persist data across container restarts:

```bash
# Create a named volume
docker volume create fdc2-data

# Run with volume mount
docker run -p 80:3001 -v fdc2-data:/app/data fdc2-app
```

## Production Considerations

### Security
- The container runs as a non-root user
- Only necessary files are included in the final image
- Health checks ensure service availability

### Performance
- Multi-stage build reduces image size
- Production dependencies only
- Optimized React build included

### Monitoring
```bash
# View logs
docker logs fdc2-container

# Check health
docker inspect --format='{{.State.Health.Status}}' fdc2-container

# Monitor resource usage
docker stats fdc2-container
```

## Deployment Examples

### Simple Production Deployment
```bash
# Build and run on port 80
docker build -t fdc2-app .
docker run -d -p 80:3001 --name fdc2-production --restart unless-stopped fdc2-app
```

### With Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Cloud Deployment
The Docker image can be deployed to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku (using `heroku.yml`)

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using port 3001
   netstat -an | grep 3001
   # Use different port
   docker run -p 8080:3001 fdc2-app
   ```

2. **Build failures**
   ```bash
   # Clean build
   docker build --no-cache -t fdc2-app .
   ```

3. **Health check failures**
   ```bash
   # Check container logs
   docker logs fdc2-container
   # Manually test health endpoint
   curl http://localhost:3001/health
   ```

### Logs and Debugging
```bash
# View real-time logs
docker logs -f fdc2-container

# Access container shell
docker exec -it fdc2-container sh

# Check internal health
docker exec fdc2-container wget -q --spider http://localhost:3001/health
```

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Frontend | Vite dev server (port 5173) | Static files served by Express |
| Backend | Separate process (port 3001) | Integrated with frontend serving |
| API URL | `http://localhost:3001` | Same origin (empty) |
| Build | Source files | Optimized build |
| Size | ~500MB | ~200MB |

## File Structure in Container

```
/app/
├── data/              # SQLite database
├── dist/              # Built React app
├── src/
│   ├── server.ts      # Express server
│   └── services/      # Database and services
├── package.json
└── node_modules/      # Production dependencies only
```

The container serves:
- Static React app at `/`
- API endpoints at `/api/*`
- Health check at `/health`
- All React routes (SPA routing)

## Security Notes

- Container runs as non-root user (nodejs:1001)
- Only production dependencies included
- No development tools in final image
- Health checks for monitoring
- Resource limits in production compose
