import { Resend } from 'resend';
import { Email } from '../../emails/Email';
import { render } from '@react-email/components';

// Get API key from environment variables
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API || import.meta.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY or VITE_RESEND_API environment variable');
}

// Initialize Resend with your API key
const resend = new Resend(RESEND_API_KEY);

interface SendPasswordResetEmailParams {
  to: string;
  passcode: string;
  expirationTime?: string;
  resetUrl?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const emailService = {
  /**
   * Send a password reset email with OTP code
   */
  async sendPasswordResetEmail({
    to,
    passcode,
    expirationTime = "15 minutes",
    resetUrl = "https://new-era-club.vercel.app/login"
  }: SendPasswordResetEmailParams): Promise<EmailResponse> {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('Resend API key is not configured');
      }

      if (!to) {
        throw new Error('Recipient email is required');
      }

      if (!passcode) {
        throw new Error('Password reset code is required');
      }

      // Send email using Resend with your React Email component
      const result = await resend.emails.send({
        from: 'NEW ERA <noreply@new-era-club.vercel.app>', // Update this to your verified domain
        to: [to],
        subject: '🔐 Password Reset Code - NEW ERA',
        react: Email({
          passcode,
          userEmail: to,
          expirationTime,
          resetUrl
        }),
        // Optional: Add text version as fallback
        text: `
NEW ERA - Password Reset Code

Hi there!

You requested a password reset for: ${to}

Your one-time password: ${passcode}

This code is valid for ${expirationTime}.

If you didn't request this password reset, please ignore this email.

Visit NEW ERA: ${resetUrl}

© 2025 NEW ERA. All rights reserved.
        `.trim()
      });

      console.log('Password reset email sent successfully:', result);

      return {
        success: true,
        message: 'Password reset email sent successfully',
        data: result
      };

    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Send a general email using the Email component
   */
  async sendCustomEmail({
    to,
    subject,
    passcode,
    resetUrl
  }: {
    to: string;
    subject: string;
    passcode?: string;
    resetUrl?: string;
  }): Promise<EmailResponse> {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('Resend API key is not configured');
      }

      const result = await resend.emails.send({
        from: 'NEW ERA <noreply@new-era-club.vercel.app>',
        to: [to],
        subject,
        react: Email({
          passcode,
          userEmail: to,
          resetUrl
        })
      });

      return {
        success: true,
        message: 'Email sent successfully',
        data: result
      };

    } catch (error: any) {
      console.error('Failed to send email:', error);
      
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Test email connectivity
   */
  async testConnection(): Promise<EmailResponse> {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('Resend API key is not configured');
      }

      // Test with a simple email to yourself
      const result = await resend.emails.send({
        from: 'NEW ERA <noreply@new-era-club.vercel.app>',
        to: ['test@example.com'], // Change this to your email for testing
        subject: 'NEW ERA Email Service Test',
        react: Email({
          passcode: '123456',
          userEmail: 'test@example.com',
          resetUrl: 'https://new-era-club.vercel.app/login'
        })
      });

      return {
        success: true,
        message: 'Email service connection successful',
        data: result
      };

    } catch (error: any) {
      console.error('Email service connection failed:', error);
      
      return {
        success: false,
        message: 'Email service connection failed',
        error: error.message || 'Unknown error occurred'
      };
    }
  }
};

export default emailService;