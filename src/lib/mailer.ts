// src/lib/mailer.ts

async function postMail(to: string, subject: string, html: string) {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (err) {
    console.error('Mail error:', err);
  }
}

const emailBase = (content: string) => `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:20px;overflow:hidden;">
    <div style="background:#1a3a3a;padding:24px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-style:italic;font-weight:900;letter-spacing:-0.5px;">
        Kumpuni Go!
      </h1>
      <p style="color:#27ae60;margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
        Community Shop Finder
      </p>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f1f5f9;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:11px;margin:0;">© 2026 Kumpuni Go · Philippines</p>
    </div>
  </div>
`;

export async function sendContributionPendingEmail(email: string, shopName: string) {
  await postMail(
    email,
    '📍 Your Contribution is Pending – Kumpuni Go',
    emailBase(`
      <h2 style="color:#1a3a3a;margin:0 0 12px;">Contribution Received! 📍</h2>
      <p style="color:#444;line-height:1.6;">
        Your shop <strong>"${shopName}"</strong> is now pending admin review.
      </p>
      <p style="color:#444;line-height:1.6;">
        We will notify you within <strong>2–7 days</strong>.
      </p>
      <p style="color:#27ae60;font-weight:bold;margin-top:16px;">
        Thank you for helping the community! 🙏
      </p>
    `)
  );
}

export async function sendContributionStatusEmail(
  email: string,
  shopName: string,
  status: 'approved' | 'rejected',
  reason?: string,
  rejectionType?: 'warning' | 'standard'
) {
  if (status === 'approved') {
    await postMail(
      email,
      '✅ Your Shop is Now Live – Kumpuni Go',
      emailBase(`
        <h2 style="color:#27ae60;margin:0 0 12px;">Shop Approved! 🎉</h2>
        <p style="color:#444;line-height:1.6;">
          Your shop <strong>"${shopName}"</strong> is now <strong>live on Kumpuni Go!</strong>
        </p>
        <p style="color:#444;line-height:1.6;">
          Other riders and commuters can now find it on the app.
        </p>
        <p style="color:#27ae60;font-weight:bold;margin-top:16px;">
          Thank you for your contribution! 🙏
        </p>
      `)
    );
  } else {
    const isWarning = rejectionType === 'warning';
    await postMail(
      email,
      isWarning
        ? '⚠️ Warning: Submission Issue – Kumpuni Go'
        : '❌ Contribution Not Approved – Kumpuni Go',
      emailBase(`
        <h2 style="color:${isWarning ? '#f59e0b' : '#e53e3e'};margin:0 0 12px;">
          ${isWarning ? '⚠️ Warning Notice' : 'Submission Not Approved'}
        </h2>
        <p style="color:#444;line-height:1.6;">
          Your submission for <strong>"${shopName}"</strong> was not approved.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:12px 16px;margin:16px 0;">
          <p style="color:#666;margin:0;font-size:13px;">
            <strong>Reason:</strong> ${reason || 'Could not be verified.'}
          </p>
        </div>
        ${isWarning
          ? `<p style="color:#f59e0b;font-weight:bold;">
              This is a formal warning. 3 warnings will result in a permanent ban from Kumpuni Go.
            </p>`
          : `<p style="color:#444;line-height:1.6;">
              You may re-edit and resubmit with corrected information and a clearer evidence photo.
            </p>`
        }
      `)
    );
  }
}

export async function sendBanEmail(email: string) {
  await postMail(
    email,
    '🚫 Account Banned – Kumpuni Go',
    emailBase(`
      <h2 style="color:#e53e3e;margin:0 0 12px;">Account Permanently Banned</h2>
      <p style="color:#444;line-height:1.6;">
        Your account has been <strong>permanently banned</strong> from Kumpuni Go due to
        repeated fake or scam submissions.
      </p>
      <p style="color:#444;line-height:1.6;">
        You will no longer be able to submit contributions.
      </p>
    `)
  );
}

export async function notifyAdmin(
  shopName: string,
  contributorEmail: string,
  type: 'new' | 'update',
  evidenceUrl?: string
) {
  try {
    await fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopName, contributorEmail, type, evidenceUrl }),
    });
  } catch (err) {
    console.error('Admin notify error:', err);
  }
}
