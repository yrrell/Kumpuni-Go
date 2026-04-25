// src/pages/api/admin-ban.ts
// Server-side route so service key is never exposed and bypasses RLS properly
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, user_id, ban_record_id } = req.body;

  try {
    if (action === 'ban') {
      // Manual ban by admin
      const { error } = await db.from('banned_users').upsert(
        {
          email,
          user_id: user_id || null,
          warning_count: 3,
          is_banned: true,
          banned_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (action === 'warn') {
      // Warning from rejection — upsert increments warning count
      const { data: existing } = await db
        .from('banned_users')
        .select('*')
        .eq('email', email)
        .single();

      const newCount = (existing?.warning_count || 0) + 1;
      const isBanned = newCount >= 3;

      const { error } = await db.from('banned_users').upsert(
        {
          email,
          user_id: user_id || null,
          warning_count: newCount,
          is_banned: isBanned,
          banned_at: isBanned ? new Date().toISOString() : (existing?.banned_at || null),
        },
        { onConflict: 'email' }
      );
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, isBanned, warning_count: newCount });
    }

    if (action === 'unban') {
      const { error } = await db
        .from('banned_users')
        .update({ is_banned: false, warning_count: 0, banned_at: null })
        .eq('id', ban_record_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (action === 'delete_record') {
      const { error } = await db.from('banned_users').delete().eq('id', ban_record_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
