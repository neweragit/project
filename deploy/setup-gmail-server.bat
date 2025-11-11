@echo off
echo 🚀 Setting up New Era Gmail Email Server...
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

REM Install dependencies
echo 📦 Installing dependencies (express, cors, nodemailer)...
npm install express cors nodemailer

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.

echo 📧 Gmail SMTP Email Server Setup
echo.
echo ⚠️  IMPORTANT: You need to configure your Gmail credentials
echo.
echo 📋 Steps to set up Gmail App Password:
echo 1. Go to your Google Account settings
echo 2. Security → 2-Step Verification (enable if not already)
echo 3. App passwords → Generate new password for "Mail"
echo 4. Copy the 16-character app password
echo.
echo 📝 Then edit gmail-email-server.js and replace:
echo    GMAIL_USER = 'your-email@gmail.com'        (your Gmail address)
echo    GMAIL_APP_PASSWORD = 'your-app-password'   (the 16-char app password)
echo.

REM Ask if user wants to edit the file now
set /p edit_now="Would you like to edit the Gmail credentials now? (y/n): "
if /i "%edit_now%"=="y" (
    echo Opening gmail-email-server.js for editing...
    notepad gmail-email-server.js
    echo.
    echo ✅ Please save the file after editing your credentials
    pause
)

echo.
echo 🚀 Starting Gmail email server on port 3001...
echo.
echo 📧 Server will handle password reset emails via your Gmail
echo 🔗 Server URL: http://localhost:3001
echo 💡 Keep this window open while using the app
echo.
echo ⚠️  To stop the server, press Ctrl+C
echo.

node gmail-email-server.js
