import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
// Support both server-side MAILERSEND_API_TOKEN and VITE_MAILERSEND_API_TOKEN from .env
const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || process.env.VITE_MAILERSEND_API_TOKEN || '';
// Optional: in trial accounts MailerSend restricts sending to the admin email. Set this env var to 'true' to force recipients to the admin.
const MAILERSEND_RESTRICT_TO_ADMIN = (process.env.MAILERSEND_RESTRICT_TO_ADMIN || 'false').toLowerCase() === 'true';
const MAILERSEND_ADMIN_EMAIL = process.env.MAILERSEND_ADMIN_EMAIL || process.env.MAILERSEND_ADMIN_EMAIL || '';

// Default from and subject to satisfy required fields for MailerSend trial
const DEFAULT_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || process.env.VITE_MAILERSEND_FROM_EMAIL || 'info@domain.com';
const DEFAULT_SUBJECT = process.env.MAILERSEND_SUBJECT || 'Your Password Reset Code';

if (!MAILERSEND_API_TOKEN) {
  console.warn('MAILERSEND_API_TOKEN is not set. The server will respond with 500 for send requests.');
}

app.post('/api/send-email', async (req, res) => {
  if (!MAILERSEND_API_TOKEN) return res.status(500).json({ error: 'MailerSend token not configured' });

  try {
    const payload = { ...req.body };

    // Ensure required fields exist
    payload.from = payload.from || { email: DEFAULT_FROM_EMAIL };
    if (!payload.subject) payload.subject = DEFAULT_SUBJECT;

    // If trial restriction is enabled, force recipient to admin email
    if (MAILERSEND_RESTRICT_TO_ADMIN) {
      if (!MAILERSEND_ADMIN_EMAIL) {
        return res.status(500).json({ error: 'MAILERSEND_ADMIN_EMAIL not configured but MAILERSEND_RESTRICT_TO_ADMIN is true' });
      }
      payload.to = [{ email: MAILERSEND_ADMIN_EMAIL }];
      payload.personalization = payload.personalization?.map(p => ({ ...p, email: MAILERSEND_ADMIN_EMAIL })) || payload.personalization;
    }

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).send(text);
    return res.status(200).send(text);
  } catch (err) {
    console.error('Error forwarding to MailerSend:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Optional: Send email via Resend (server-side). Requires RESEND_API_KEY in env.
// POST body should include: { from, to, subject, html }
app.post('/api/send-email-resend', async (req, res) => {
  const { from, to, subject, html } = req.body || {};
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    // Lazy import to avoid adding top-level dep requirement when not used
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const sendReq = {
      from: from || DEFAULT_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: subject || DEFAULT_SUBJECT,
      html: html || ''
    };

    const result = await resend.emails.send(sendReq);
    return res.status(200).json({ result });
  } catch (err) {
    console.error('Error sending via Resend:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => console.log(`Email proxy listening on http://localhost:${PORT}`));
