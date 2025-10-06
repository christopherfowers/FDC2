@echo off
REM FDC2 Docker Setup Script for Windows
REM This script verifies Docker setup for the static FDC application

REM Get the project root directory (two levels up from this script)
cd /d "%~dp0..\.."

echo 🎯 Setting up FDC2 Docker environment...

REM Check if docker-compose.yml exists
if not exist "docker\docker-compose.yml" (
    echo ⚠️  docker\docker-compose.yml not found
    echo Make sure the docker directory exists with docker-compose.yml
    exit /b 1
) else (
    echo ✅ docker\docker-compose.yml found
)

echo 🐳 Ready to run: docker-compose -f docker\docker-compose.yml up --build
echo 📊 Application will serve CSV data as static assets
echo.
echo 🌐 FDC2 Static Site will be available at: http://localhost:3002
echo.
echo To start FDC2:
echo   docker-compose -f docker\docker-compose.yml up --build
echo.
echo To view logs:
echo   docker-compose -f docker\docker-compose.yml logs -f fdc2-app
echo.
echo To stop:
echo   docker-compose -f docker\docker-compose.yml down

pause
