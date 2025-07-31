@echo off
echo 🚀 Quick Gmail Email Setup for New Era
echo.
echo 📧 Your Gmail: veeoai945@gmail.com
echo.

REM Install dependencies quickly
echo 📦 Installing dependencies...
npm install express cors nodemailer --silent

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed!
echo.

echo ⚠️  IMPORTANT: You need a Gmail App Password (NOT your regular password)
echo.
echo 📋 Quick Steps to Get App Password:
echo 1. Go to: https://myaccount.google.com/security
echo 2. Enable 2-Step Verification if not already enabled
echo 3. Click "App passwords"
echo 4. Select "Mail" and generate password
echo 5. Copy the 16-character password (like: abcd efgh ijkl mnop)
echo.

echo 📝 Now edit gmail-email-server.js and replace:
echo    GMAIL_APP_PASSWORD = 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE'
echo    with your actual App Password
echo.

set /p ready="Have you updated the App Password in gmail-email-server.js? (y/n): "
if /i not "%ready%"=="y" (
    echo.
    echo 📝 Opening gmail-email-server.js for editing...
    notepad gmail-email-server.js
    echo.
    echo ✅ Please save the file after adding your App Password
    pause
)

echo.
echo 🚀 Starting Gmail email server...
echo.
echo 📧 Server will send emails from: veeoai945@gmail.com
echo 🔗 Server URL: http://localhost:3001
echo 💡 Keep this window open while testing forgot password
echo.
echo ⚠️  To stop the server, press Ctrl+C
echo.

node gmail-email-server.js
