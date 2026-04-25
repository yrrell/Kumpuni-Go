// src/pages/api/admin-shop.ts
// Server-side admin shop CRUD — service key never exposed to browser, bypasses RLS
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, shop_id, update_id, patch } = req.body;

  try {
    // ── UPDATE shop status (approve / reject / etc.) ──
    if (action === 'update_shop_status') {
      const { error } = await db.from('shops').update(patch).eq('id', shop_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── EDIT shop fields ──
    if (action === 'edit_shop') {
      const { error } = await db.from('shops').update(patch).eq('id', shop_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE shop ──
    if (action === 'delete_shop') {
      const { error } = await db.from('shops').delete().eq('id', shop_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── APPROVE update: apply patch to shops + mark update approved ──
    if (action === 'approve_update') {
      // Apply the patch to the actual shop
      if (patch && Object.keys(patch).length > 0) {
        const { error: shopErr } = await db.from('shops').update(patch).eq('id', shop_id);
        if (shopErr) return res.status(500).json({ error: 'Shop update error: ' + shopErr.message });
      }
      // Mark update record as approved
      const { error: updErr } = await db.from('shop_updates').update({ status: 'approved' }).eq('id', update_id);
      if (updErr) return res.status(500).json({ error: 'Status update error: ' + updErr.message });
      return res.status(200).json({ ok: true });
    }

    // ── REJECT update record ──
    if (action === 'reject_update') {
      const { error } = await db.from('shop_updates').update({ status: 'rejected' }).eq('id', update_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE update record ──
    if (action === 'delete_update') {
      const { error } = await db.from('shop_updates').delete().eq('id', update_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
