@echo off
echo ========================================
echo  Starting PDF Watermark Server
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "server\package.json" (
    echo Error: package.json not found in server directory
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Navigate to server directory
cd server

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Set environment variables
echo Setting up environment variables...
set VITE_SUPABASE_URL=%VITE_SUPABASE_URL%
set VITE_SUPABASE_ANON_KEY=%VITE_SUPABASE_ANON_KEY%
set PORT=3002

echo.
echo ========================================
echo  PDF Watermark Server Configuration
echo ========================================
echo Port: %PORT%
echo Supabase URL: %VITE_SUPABASE_URL%
echo.

REM Start the server
echo Starting server...
echo.
echo Server will be available at: http://localhost:%PORT%
echo Health check: http://localhost:%PORT%/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================

npm start

pause