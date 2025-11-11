/// <reference path="./deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otpCode, type = 'password_reset' } = await req.json()

    if (!email || !otpCode) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Email templates
    const getEmailTemplate = (type: string, otpCode: string) => {
      const templates = {
        password_reset: {
          subject: '🔐 New Era - Password Reset Code',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          `,
          text: `
New Era - Password Reset Code

You requested to reset your password for your New Era account.

Your verification code is: ${otpCode}

This code expires in 10 minutes and can only be used once.
Enter this code in the New Era app to reset your password.

If you didn't request this password reset, please ignore this email.

© 2024 New Era - Space Exploration Platform
          `
        }
      }
      return templates[type] || templates.password_reset
    }

    const template = getEmailTemplate(type, otpCode)

    // Use Supabase's built-in email service or integrate with external service
    // For now, we'll use a simple email service integration
    
    // You can integrate with services like:
    // - SendGrid
    // - AWS SES  
    // - Resend
    // - Postmark
    
    // Send email using Resend API
    const emailApiKey = Deno.env.get('EMAIL_API_KEY')
    
    if (!emailApiKey) {
      // For development, log the email content
      console.log('📧 Email would be sent:', {
        to: email,
        subject: template.subject,
        otpCode: otpCode
      })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully (development mode)',
          otpCode: otpCode // Remove this in production
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'New Era <onboarding@resend.dev>',
        to: email,
        subject: template.subject,
        html: template.html,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Email service error:', errorText)
      throw new Error('Failed to send email')
    }

    const result = await emailResponse.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-otp-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
