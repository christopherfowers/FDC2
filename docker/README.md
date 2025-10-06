# Docker Configuration

This directory contains all Docker-related configuration files for the FDC2 application.

## Files

- **Dockerfile** - Main Dockerfile for building the production image
- **Dockerfile.nginx** - Alternative Dockerfile with custom nginx configuration
- **docker-compose.yml** - Development Docker Compose configuration
- **docker-compose.prod.yml** - Production Docker Compose configuration
- **docker-compose.nginx.yml** - Docker Compose with custom nginx
- **nginx.conf** - Custom Nginx configuration file
- **.dockerignore** - Files to exclude from Docker build context

## Usage

### Building the Docker Image

From the project root:

```bash
docker-compose -f docker/docker-compose.yml build
```

### Running the Application

Development mode:
```bash
cd /path/to/FDC2
./scripts/deploy/deploy.sh development
```

Production mode:
```bash
cd /path/to/FDC2
./scripts/deploy/deploy.sh production
```

### Direct Docker Compose Commands

From project root:
```bash
# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## Notes

- All Dockerfiles use multi-stage builds for optimized image size
- The context is set to the parent directory (..) to access all project files
- CSV data files are included as static assets in the build
- The application runs on port 3002 (development) or 80 (production)
