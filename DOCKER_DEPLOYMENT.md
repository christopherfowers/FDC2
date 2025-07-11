# Docker Deployment Guide

This guide covers how to deploy the Fire Direction Calculator (FDC2) using Docker as a static web application.

## Overview

The application is containerized as a static web application that:
- Builds the React frontend into static files
- Serves the static files via Nginx
- Includes CSV data files as static assets
- No backend server or database required

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
# Development (port 3000)
docker run -p 3000:80 --name fdc2-container fdc2-app

# Production (port 80)
docker run -p 80:80 --name fdc2-production fdc2-app
```

### No Data Persistence Needed
The application is fully static with CSV data files built into the image.

## Docker Compose Options

### Development
```bash
docker-compose up --build
```
- Exposes on port 3000
- Suitable for local testing

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
- Exposes on port 80
- Includes resource limits
- Runs in detached mode

## Environment Variables

| Variable   | Default      | Description                                             |
| ---------- | ------------ | ------------------------------------------------------- |
| `NODE_ENV` | `production` | Build environment (always production for static builds) |

## Health Checks

The container serves static files via Nginx and responds at:
- Root URL: `http://localhost/` (or your domain)  
- Service is healthy when static files load correctly

## Data Assets

CSV data files are included as static assets in the build:
- `/data/M819_Smoke_Shell_Ballistics.csv`
- `/data/M821_HE_mortar_data.csv` 
- `/data/M853A1_Illumination_Round_Ballistics.csv`
- `/data/M879_Practice_Round_Ballistics.csv`

No data persistence or volumes required.

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
        proxy_pass http://localhost:80;
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
   # Check what's using port 80
   netstat -an | grep :80
   # Use different port
   docker run -p 8080:80 fdc2-app
   ```

2. **Build failures**
   ```bash
   # Clean build
   docker build --no-cache -t fdc2-app .
   ```

3. **Static file loading issues**
   ```bash
   # Check container logs
   docker logs fdc2-container
   # Test direct access
   curl http://localhost/
   ```

### Logs and Debugging
```bash
# View real-time logs
docker logs -f fdc2-container

# Access container shell (if needed)
docker exec -it fdc2-container sh

# Check Nginx status
docker exec fdc2-container nginx -t
```

## Development vs Production

| Aspect   | Development                 | Production                   |
| -------- | --------------------------- | ---------------------------- |
| Frontend | Vite dev server (port 5173) | Static files served by Nginx |
| Backend  | None (static CSV data)      | None (static CSV data)       |
| API URL  | Not applicable              | Not applicable               |
| Build    | Source files                | Optimized static build       |
| Size     | ~200MB                      | ~50MB                        |

## File Structure in Container

```
/usr/share/nginx/html/
├── index.html         # Main React app
├── assets/           # JS, CSS, images
├── data/             # CSV data files
│   ├── M819_Smoke_Shell_Ballistics.csv
│   ├── M821_HE_mortar_data.csv
│   ├── M853A1_Illumination_Round_Ballistics.csv
│   └── M879_Practice_Round_Ballistics.csv
└── manifest.json     # PWA manifest
```

The container serves:
- Static React app at `/`
- CSV data files at `/data/*`
- All React routes via SPA routing (index.html fallback)

## Security Notes

- Nginx runs as nginx user (non-root)
- Only static files served
- No server-side code execution
- Production build strips debug information
- Minimal attack surface (static files only)
