// Simple Email Server using Resend API
// Run with: node email-server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Resend API configuration
const RESEND_API_KEY = 're_jLQe65zS_JRBVhzhpxH1be5R4ME5TzhZu';

// Email template function
function createEmailHTML(otpCode) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Code</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      margin: 0; 
      padding: 20px;
      color: #ffffff;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 30px; 
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      color: white; 
      font-size: 28px;
      font-weight: bold;
    }
    .content { 
      padding: 40px 30px;
      text-align: center;
    }
    .otp-code { 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white; 
      font-size: 32px; 
      font-weight: bold; 
      padding: 20px 30px; 
      border-radius: 12px; 
      display: inline-block; 
      margin: 20px 0;
      letter-spacing: 8px;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
    }
    .warning { 
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0;
      font-size: 14px;
    }
    .footer { 
      background: rgba(0, 0, 0, 0.2);
      padding: 20px; 
      text-align: center; 
      color: #9ca3af;
      font-size: 12px;
    }
    .cosmic-text {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 New Era</h1>
      <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9);">Space Exploration Platform</p>
    </div>
    <div class="content">
      <h2 class="cosmic-text">Password Reset Request</h2>
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
        You requested to reset your password. Use the verification code below to proceed:
      </p>
      <div class="otp-code">${otpCode}</div>
      <p style="color: #9ca3af; font-size: 14px;">
        Enter this code in the New Era app to reset your password.
      </p>
      <div class="warning">
        ⚠️ This code expires in 10 minutes and can only be used once.
        If you didn't request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>© 2024 New Era - Space Exploration Platform</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email via Resend API
async function sendEmailViaResend(email, otpCode) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'New Era <onboarding@resend.dev>',
        to: email,
        subject: '🔐 New Era - Password Reset Code',
        html: createEmailHTML(otpCode),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw error;
  }
}

// API endpoint to send OTP email
app.post('/send-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP code are required' 
      });
    }

    console.log(`📧 Sending OTP email to: ${email}`);
    console.log(`🔐 OTP Code: ${otpCode}`);

    const result = await sendEmailViaResend(email, otpCode);

    console.log('✅ Email sent successfully:', result);

    res.json({
      success: true,
      message: 'Email sent successfully',
      emailId: result.id
    });

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email server running on http://localhost:${PORT}`);
  console.log(`📧 Ready to send emails via Resend API`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
