@echo off
echo 🚀 Setting up New Era Email Integration with Resend...
echo.

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Installing...
    echo.
    npm install -g supabase
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Supabase CLI. Please install manually:
        echo npm install -g supabase
        pause
        exit /b 1
    )
)

echo ✅ Supabase CLI ready
echo.

REM Login to Supabase (if not already logged in)
echo 🔐 Checking Supabase login status...
supabase projects list >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Supabase:
    supabase login
    if %errorlevel% neq 0 (
        echo ❌ Login failed. Please try again.
        pause
        exit /b 1
    )
)

echo ✅ Supabase login verified
echo.

REM Set the Resend API key
echo 📧 Setting up Resend API key...
supabase secrets set EMAIL_API_KEY=re_jLQe65zS_JRBVhzhpxH1be5R4ME5TzhZu

if %errorlevel% equ 0 (
    echo ✅ Resend API key set successfully!
    echo.
) else (
    echo ❌ Failed to set API key. Make sure your project is linked:
    echo supabase link --project-ref YOUR_PROJECT_ID
    echo.
    pause
    exit /b 1
)

REM Deploy the Edge Function
echo 🚀 Deploying send-otp-email function...
supabase functions deploy send-otp-email

if %errorlevel% equ 0 (
    echo.
    echo ✅ 🎉 Email integration setup complete!
    echo.
    echo 📋 What's working now:
    echo ✅ Resend API key configured
    echo ✅ Edge Function deployed
    echo ✅ Beautiful HTML emails will be sent
    echo ✅ OTP codes delivered to user emails
    echo.
    echo 🧪 Test your forgot password flow:
    echo 1. Go to your app login page
    echo 2. Click "Forgot your password?"
    echo 3. Enter an email address
    echo 4. Check the email inbox for the OTP!
    echo.
    echo 📧 Emails will be sent from: New Era ^<onboarding@resend.dev^>
    echo.
) else (
    echo.
    echo ❌ Deployment failed. Please check:
    echo 1. Project is linked: supabase link --project-ref YOUR_PROJECT_ID
    echo 2. You have proper permissions
    echo 3. Function files exist in supabase/functions/send-otp-email/
    echo.
)

pause
