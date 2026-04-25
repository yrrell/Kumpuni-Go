// src/pages/api/notify-admin.ts
// Sends email to admin when a new contribution is submitted
// Uses Gmail SMTP via Nodemailer (zero billing)

import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shopName, contributorEmail, type = 'new', evidenceUrl } = req.body;

  const subject =
    type === 'update'
      ? `✏️ Shop Update Request – ${shopName}`
      : `📍 New Shop Submission – ${shopName}`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <img src="https://mayapabiyahe.vercel.app/assets/mayap-logo.png" width="60" style="margin-bottom:16px;" />
      <h2 style="color:#1a3a3a;margin:0 0 8px;">
        ${type === 'update' ? '✏️ Update Request' : '📍 New Contribution'}
      </h2>
      <p style="color:#444;">
        A contributor has submitted a <strong>${type === 'update' ? 'shop update' : 'new shop'}</strong>:
        <br/><strong>"${shopName}"</strong>
      </p>
      <p style="color:#444;">Submitted by: <strong>${contributorEmail}</strong></p>
      ${evidenceUrl ? `<p><a href="${evidenceUrl}" style="color:#27ae60;font-weight:bold;">👁️ View Evidence Photo</a></p>` : ''}
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
        style="display:inline-block;background:#27ae60;color:white;padding:12px 24px;border-radius:12px;font-weight:900;text-decoration:none;margin-top:16px;">
        Review in Admin Panel →
      </a>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#aaa;font-size:12px;">Mayap A Biyahe – Admin Notification</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Mayap A Biyahe" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Admin receives at same Gmail
      subject,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Admin notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
