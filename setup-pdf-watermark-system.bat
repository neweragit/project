@echo off
echo ========================================
echo  PDF Watermark System Setup
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Step 1: Installing server dependencies...
cd server
if not exist "package.json" (
    echo Error: package.json not found in server directory
    pause
    exit /b 1
)

npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo Environment file created from template.
        echo Please edit server/.env with your Supabase credentials before starting the server.
    ) else (
        echo Warning: No .env.example found. Please create .env manually.
    )
) else (
    echo Environment file already exists.
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit server/.env with your Supabase credentials
echo 2. Run the database migration in Supabase SQL editor:
echo    database/migrations/20240212_create_download_logs_table.sql
echo 3. Add VITE_PDF_WATERMARK_SERVER_URL=http://localhost:3002 to your main .env file
echo 4. Start the server with: start-pdf-watermark-server.bat
echo.
echo Documentation: server/README.md
echo ========================================

pause