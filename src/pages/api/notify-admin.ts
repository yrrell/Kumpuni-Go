import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shopName, contributorEmail, type = 'new', evidenceUrl } = req.body;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS },
  });

  const subject = type === 'update'
    ? `✏️ Shop Update Request – ${shopName}`
    : `📍 New Shop Submission – ${shopName}`;

  try {
    await transporter.sendMail({
      from: `"Kumpuni Go" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject,
      html: `<p>${type === 'update' ? 'Update' : 'New shop'}: <strong>${shopName}</strong> by ${contributorEmail}</p>${evidenceUrl ? `<p><a href="${evidenceUrl}">View Evidence</a></p>` : ''}<p><a href="${appUrl}/admin">Review in Admin Panel</a></p>`,
    });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
