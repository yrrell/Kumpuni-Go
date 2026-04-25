// src/pages/api/send-email.ts
// Zero-billing Gmail SMTP using Nodemailer + App Password

import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // mayap.a.biyahe@gmail.com
    pass: process.env.GMAIL_APP_PASS,   // 16-char App Password from Google Account
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: 'Missing fields' });

  try {
    await transporter.sendMail({
      from: `"Mayap A Biyahe" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: err.message });
  }
}
