@echo off
REM Fire Direction Calculator - Quick Deployment Script for Windows

echo 🎯 Fire Direction Calculator - Docker Deployment
echo ================================================

REM Parse command line arguments
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set PORT=%2
if "%ENVIRONMENT%"=="development" (
    if "%PORT%"=="" set PORT=3001
    set COMPOSE_FILE=docker-compose.yml
    echo 🧑‍💻 Deploying in DEVELOPMENT mode
) else (
    if "%PORT%"=="" set PORT=80
    set COMPOSE_FILE=docker-compose.prod.yml
    echo 🚀 Deploying in PRODUCTION mode
)

echo 📦 Building Docker image...
docker-compose -f %COMPOSE_FILE% build

echo 🛑 Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down >nul 2>&1

echo 🚀 Starting FDC2 application...
docker-compose -f %COMPOSE_FILE% up -d

echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Health check
echo 🔍 Running health check...
curl -f "http://localhost:%PORT%/health" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Application is healthy!
    echo.
    echo 🎯 Fire Direction Calculator is now running!
    echo 🌐 Access the application at: http://localhost:%PORT%
    echo 📊 Health check: http://localhost:%PORT%/health
    echo 🔧 API endpoints: http://localhost:%PORT%/api/*
    echo.
    echo 📋 Useful commands:
    echo    View logs: docker-compose -f %COMPOSE_FILE% logs -f
    echo    Stop app:  docker-compose -f %COMPOSE_FILE% down
    echo    Restart:   docker-compose -f %COMPOSE_FILE% restart
) else (
    echo ❌ Health check failed. Check logs with:
    echo    docker-compose -f %COMPOSE_FILE% logs
    exit /b 1
)
