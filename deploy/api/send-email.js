import { Resend } from 'resend';

const resend = new Resend('re_ikotQkQD_2e827uTPw6a7rJx6TYryfhYW');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, html } = req.body;

    try {
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
      });

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}