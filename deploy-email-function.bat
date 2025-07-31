@echo off
echo 🚀 Deploying Supabase Edge Function for Email Sending...
echo.

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    pause
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Deploy the Edge Function
echo 📧 Deploying send-otp-email function...
supabase functions deploy send-otp-email

if %errorlevel% equ 0 (
    echo.
    echo ✅ Edge Function deployed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Test the function in your Supabase dashboard
    echo 2. Set up email service API key if needed:
    echo    supabase secrets set EMAIL_API_KEY=your_key_here
    echo 3. Your app will now send real emails for password reset!
    echo.
) else (
    echo.
    echo ❌ Deployment failed. Please check:
    echo 1. You are logged in: supabase login
    echo 2. Project is linked: supabase link --project-ref YOUR_PROJECT_ID
    echo 3. You have proper permissions
    echo.
)

pause
