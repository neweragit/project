# Email Service Usage Guide

This guide shows how to use the NEW ERA email service with Resend and React Email components.

## 🛠️ Setup Complete ✅

### Files Updated:
1. **`emails/Email.tsx`** - React Email component with proper NEW ERA branding
2. **`src/lib/email.ts`** - Email service using Resend SDK
3. **`src/lib/supabase.ts`** - Updated password reset function
4. **`src/pages/EmailTest.tsx`** - Test page for email functionality

## 🔐 Environment Variables

Make sure these are set in your `.env` file:

```env
# Your Resend API Key
VITE_RESEND_API=re_KT9Su1Vb_NYXuEhGAo1tMmx3WgA51nEjJ

# Alternative naming (backup)
RESEND_API_KEY=re_6JLjjcpY_Q7dVyUsxfD4pRHjmJ5CQSpFp
```

## 📧 Email Service Usage

### Send Password Reset Email

```typescript
import { emailService } from '../lib/email';

// Send password reset email to user
const result = await emailService.sendPasswordResetEmail({
  to: 'user@example.com',
  passcode: '123456',
  expirationTime: '15 minutes',
  resetUrl: 'https://new-era-club.vercel.app/login'
});

if (result.success) {
  console.log('✅ Email sent successfully');
} else {
  console.error('❌ Failed to send email:', result.error);
}
```

### Send Custom Email

```typescript
const result = await emailService.sendCustomEmail({
  to: 'user@example.com',
  subject: '🔐 Your NEW ERA Access Code',
  passcode: '654321',
  resetUrl: 'https://new-era-club.vercel.app/login'
});
```

### Test Connection

```typescript
const result = await emailService.testConnection();
console.log('Connection test:', result.success ? 'Passed' : 'Failed');
```

## 🎯 How Password Reset Works Now

1. **User requests password reset** via Login page
2. **System generates 6-digit OTP** and stores in database
3. **Email service sends branded email** using React Email component
4. **User receives professional email** with NEW ERA branding and OTP
5. **User enters OTP** in the reset form
6. **System verifies and allows password change**

## 🚀 Testing Your Email

Visit `/email-test` in your app to test the email functionality:

```bash
# Start your dev server
npm run dev

# Visit the test page
# http://localhost:5173/email-test
```

## 📝 React Email Component Features

The `Email.tsx` component includes:
- ✅ Professional NEW ERA branding
- ✅ Responsive design
- ✅ Security warnings
- ✅ Dynamic OTP display
- ✅ Proper typography and spacing
- ✅ Call-to-action button
- ✅ Legal footer

## 🔄 Password Reset Flow Integration

The password reset is now fully integrated:

1. **Login Page** → User clicks "Forgot Password"
2. **Enter Email** → System validates email exists
3. **Generate OTP** → 6-digit code created and stored
4. **Send Email** → Beautiful branded email sent via Resend
5. **Enter OTP** → User inputs code from email
6. **Reset Password** → User sets new password
7. **Success** → User can log in with new password

## ⚡ Environment Notes

- **Development**: OTP codes are logged to console for testing
- **Production**: Only email delivery, no console logging
- **Fallback**: If direct Resend fails, system tries proxy endpoint

## 🛡️ Security Features

- ✅ OTP expires after 15 minutes
- ✅ One-time use only
- ✅ Email validation before sending
- ✅ No sensitive data in client logs (production)
- ✅ Professional warning messages in email

## 🎨 Customization

To customize the email template, edit `emails/Email.tsx`:

```tsx
// Change colors, text, or layout
<Container style={{
  background: "your-custom-gradient",
  borderRadius: "18px",
  // ... other styles
}}>
```

## 📞 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify your Resend API key is active
3. Test with the `/email-test` page
4. Check console for error messages

**Your email service is now ready! 🚀**