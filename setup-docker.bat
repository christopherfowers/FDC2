@echo off
REM FDC2 Docker Setup Script for Windows
REM This script ensures the host directory for SQLite database exists with proper permissions

echo 🎯 Setting up FDC2 Docker environment...

REM Create the fdc2-data directory if it doesn't exist
if not exist "fdc2-data" (
    echo 📁 Creating fdc2-data directory...
    mkdir fdc2-data
    echo ✅ Directory created
) else (
    echo 📁 Directory fdc2-data already exists
)

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ⚠️  docker-compose.yml not found in current directory
    echo Make sure you're running this script in the same directory as your docker-compose.yml
) else (
    echo ✅ docker-compose.yml found
)

echo 🐳 Ready to run: docker-compose up -d
echo.
echo 📊 Database will be stored in: %cd%\fdc2-data
echo 🌐 FDC2 will be available at: http://localhost:3002
echo.
echo To start FDC2:
echo   docker-compose up -d
echo.
echo To view logs:
echo   docker-compose logs -f fdc
echo.
echo To stop:
echo   docker-compose down

pause
