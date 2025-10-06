# Project Structure Cleanup - Summary

This document describes the reorganization of the FDC2 project for better maintainability.

## Changes Made

### New Directories Created

1. **`docs/`** - All documentation files
2. **`docker/`** - All Docker-related configuration
3. **`lighthouse-reports/`** - Performance audit reports
4. **`test-results/`** - Test files and results
5. **`scripts/deploy/`** - Deployment and setup scripts

### File Relocations

#### Documentation (moved to `docs/`)
- BACKEND_README.md
- DOCKER_DEPLOYMENT.md
- DOCKER_SQLITE_TROUBLESHOOTING.md
- ELEVATION_IMPLEMENTATION.md
- ELEVATION_QUICK_REFERENCE.md
- ELEVATION_SUPPORT.md
- FONTAWESOME_SETUP.md
- FPF_FEATURE_TODO.md
- MGRS_SERVICE_README.md
- MOBILE_NAVIGATION.md
- NAVIGATION_BEHAVIOR.md
- NAVIGATION_SOLUTION.md
- PERFORMANCE_OPTIMIZATION.md
- PWA_README.md
- SEO_IMPLEMENTATION.md
- SEO_SITEMAP_FIX.md

#### Docker Files (moved to `docker/`)
- docker-compose.yml
- docker-compose.prod.yml
- docker-compose.nginx.yml
- Dockerfile
- Dockerfile.nginx
- nginx.conf

#### Lighthouse Reports (moved to `lighthouse-reports/`)
- lighthouse-current.json
- lighthouse-desktop.json
- lighthouse-landing.json
- lighthouse-optimized.json
- lighthouse-production.json
- lighthouse-simplified.json
- localhost_*.html (HTML reports)

#### Test Files (moved to `test-results/`)
- test-csv-browser.html
- test-csv-service.js
- test-elevation.js
- test-fd-flow.js
- test-mgrs.js

#### Scripts (moved to `scripts/deploy/`)
- deploy.sh
- deploy.bat
- setup-docker.sh
- setup-docker.bat
- debug-docker.sh
- full-debug.sh
- fix-fontawesome.ps1 (moved to `scripts/`)

### Updated References

All deployment scripts have been updated to reference the new locations:
- Docker compose files now use correct paths (e.g., `docker/docker-compose.yml`)
- Dockerfiles updated to use parent directory context
- README.md updated with new structure and documentation links
- Each new directory includes its own README.md with usage instructions

## Root Directory Structure

```
FDC2/
├── data/                      # Ballistic data CSV files
├── docker/                    # Docker configuration
├── docs/                      # Project documentation
├── lighthouse-reports/        # Performance reports
├── public/                    # Static assets
├── scripts/                   # Build and utility scripts
│   └── deploy/               # Deployment scripts
├── src/                      # Application source code
├── test-results/             # Test files and results
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── eslint.config.js         # ESLint configuration
├── index.html               # Main HTML entry point
├── LICENSE                  # Project license
├── package.json             # NPM dependencies
├── postcss.config.js        # PostCSS configuration
├── README.md                # Main project README
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig*.json           # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

## Benefits

1. **Cleaner Root Directory** - Easier to navigate and understand project structure
2. **Better Organization** - Related files grouped together
3. **Easier Maintenance** - Clear separation of concerns
4. **Improved Documentation** - Each directory has its own README
5. **Consistent Structure** - Follows common project organization patterns

## Usage After Reorganization

### Running Deployment Scripts

All scripts should be run from the project root:

```bash
# Development deployment
./scripts/deploy/deploy.sh development

# Production deployment
./scripts/deploy/deploy.sh production

# Setup Docker
./scripts/deploy/setup-docker.sh
```

### Docker Commands

From project root:

```bash
# Build
docker-compose -f docker/docker-compose.yml build

# Start
docker-compose -f docker/docker-compose.yml up -d

# Logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop
docker-compose -f docker/docker-compose.yml down
```

### Accessing Documentation

All documentation is now in the `docs/` directory. See `docs/README.md` for an index of all documentation files.

### Viewing Reports

- Lighthouse reports: See `lighthouse-reports/README.md`
- Test results: See `test-results/README.md`

## Migration Notes

- All scripts have been updated to work with the new structure
- No changes to application code were necessary
- Git history is preserved for all moved files
- All relative paths in documentation updated
