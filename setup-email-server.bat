@echo off
echo 🚀 Setting up New Era Email Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Install email server dependencies
echo 📦 Installing email server dependencies...
echo.

REM Create a temporary package.json for dependencies
echo {> temp-package.json
echo   "name": "email-server",>> temp-package.json
echo   "version": "1.0.0",>> temp-package.json
echo   "dependencies": {>> temp-package.json
echo     "express": "^4.18.2",>> temp-package.json
echo     "cors": "^2.8.5">> temp-package.json
echo   }>> temp-package.json
echo }>> temp-package.json

npm install express cors

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    del temp-package.json
    pause
    exit /b 1
)

del temp-package.json

echo ✅ Dependencies installed successfully!
echo.

REM Start the email server
echo 🚀 Starting email server on port 3001...
echo.
echo 📧 Email server will handle password reset emails
echo 🔗 Server URL: http://localhost:3001
echo 💡 Keep this window open while using the app
echo.
echo ⚠️  To stop the server, press Ctrl+C
echo.

node email-server.js
