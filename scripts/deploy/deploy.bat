@echo off
REM Fire Direction Calculator - Quick Deployment Script for Windows

REM Get the project root directory (two levels up from this script)
cd /d "%~dp0..\.."

echo 🎯 Fire Direction Calculator - Docker Deployment
echo ================================================

REM Parse command line arguments
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set PORT=%2
if "%ENVIRONMENT%"=="development" (
    if "%PORT%"=="" set PORT=3002
    set COMPOSE_FILE=docker\docker-compose.yml
    echo 🧑‍💻 Deploying in DEVELOPMENT mode
) else (
    if "%PORT%"=="" set PORT=80
    set COMPOSE_FILE=docker\docker-compose.prod.yml
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
curl -f "http://localhost:%PORT%/" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Application is healthy!
    echo.
    echo 🎯 Fire Direction Calculator is now running!
    echo 🌐 Access the application at: http://localhost:%PORT%
    echo  Static CSV data available at: http://localhost:%PORT%/data/
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
