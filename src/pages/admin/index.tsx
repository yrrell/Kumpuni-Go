// src/pages/admin/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sendContributionStatusEmail, sendBanEmail } from '../../lib/mailer';
import { CheckCircle, XCircle, Trash2, Edit3, RefreshCw, AlertTriangle, Ban, X } from 'lucide-react';

// Read-only client for fetching data (uses anon key — reads only)
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = 'pending' | 'approved' | 'rejected' | 'updates' | 'banned';

const STANDARD_REASONS = [
  'Incomplete information',
  'Unclear shop name',
  'Wrong category selected',
  'Duplicate shop entry',
  'Poor quality evidence photo',
  'Invalid contact number',
  'Custom reason...',
];
const WARN_REASONS = [
  'Fake/non-existent shop',
  'Scam submission',
  'Fabricated information',
  'Custom reason...',
];

// ── Toast ──
function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err' | 'load'; onClose: () => void }) {
  useEffect(() => {
    if (type !== 'load') { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }
  }, [type, onClose]);
  const bg = type === 'ok' ? 'bg-[#27ae60]' : type === 'err' ? 'bg-red-500' : 'bg-[#1a3a3a]';
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[200px] max-w-[90vw] ${bg} text-white`}>
      {type === 'load' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />}
      {type === 'ok'   && <CheckCircle size={15} className="flex-shrink-0" />}
      {type === 'err'  && <XCircle size={15} className="flex-shrink-0" />}
      <span className="font-black text-[11px] uppercase tracking-wide flex-1">{msg}</span>
      {type !== 'load' && <button onClick={onClose}><X size={13} /></button>}
    </div>
  );
}

// ── Server-side ban helper ──
async function serverBan(body: Record<string, any>): Promise<{ ok: boolean; error?: string; [k: string]: any }> {
  const res = await fetch('/api/admin-ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Server-side shop CRUD helper (bypasses RLS) ──
async function serverShop(body: Record<string, any>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/admin-shop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending');
  const [shops, setShops] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [editShop, setEditShop] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<{ shop: any; mode: 'warning' | 'standard'; isUpdate?: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASS || 'mayap2024admin';
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'load' } | null>(null);

  const showToast = useCallback((msg: string, type: 'ok' | 'err' | 'load') => setToast({ msg, type }), []);
  const hideToast = useCallback(() => setToast(null), []);

  // ── Fetch all data from Supabase ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: shopData, error: shopErr }, { data: updateData }, { data: banData }] = await Promise.all([
      db.from('shops').select('*').order('created_at', { ascending: false }),
      db.from('shop_updates').select('*').order('created_at', { ascending: false }),
      db.from('banned_users').select('*').order('created_at', { ascending: false }),
    ]);
    if (shopErr) console.error('Shop fetch error:', shopErr.message);
    setShops(shopData || []);
    setUpdates(updateData || []);
    setBannedUsers(banData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminAuthed) return;
    fetchData();
    const ch = db.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_updates' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_users' }, fetchData)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [adminAuthed, fetchData]);

  const pending  = shops.filter(s => s.status === 'pending');
  const approved = shops.filter(s => s.status === 'approved');
  const rejected = shops.filter(s => s.status === 'rejected');

  // ── APPROVE shop ──
  const handleApprove = async (shop: any) => {
    showToast('Approving...', 'load');
    const result = await serverShop({
      action: 'update_shop_status',
      shop_id: shop.id,
      patch: { status: 'approved', rejection_reason: null, rejection_type: null },
    });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    // Optimistic UI update
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: 'approved', rejection_reason: null, rejection_type: null } : s));
    if (shop.email) await sendContributionStatusEmail(shop.email, shop.name, 'approved');
    showToast('✓ Approved: ' + shop.name, 'ok');
    fetchData();
  };

  // ── REJECT (opens modal) ──
  const openRejectModal = (shop: any, mode: 'warning' | 'standard', isUpdate = false) => {
    setRejectModal({ shop, mode, isUpdate });
    setRejectReason('');
    setCustomReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    const { shop, mode, isUpdate } = rejectModal;
    const finalReason = rejectReason === 'Custom reason...' ? customReason : rejectReason;
    if (!finalReason) { alert('Please select a reason.'); return; }
    showToast('Rejecting...', 'load');
    setRejectModal(null);

    if (isUpdate) {
      // Reject a shop_update record via server
      const result = await serverShop({ action: 'reject_update', update_id: shop.id });
      if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
      // Optimistic UI update
      setUpdates(prev => prev.map(u => u.id === shop.id ? { ...u, status: 'rejected' } : u));
      if (shop.email) await sendContributionStatusEmail(shop.email, shop.updated_name || shop.original_name, 'rejected', finalReason, 'standard');
    } else {
      // Reject a shop via server
      const result = await serverShop({
        action: 'update_shop_status',
        shop_id: shop.id,
        patch: { status: 'rejected', rejection_reason: finalReason, rejection_type: mode },
      });
      if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
      // Optimistic UI update
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: 'rejected', rejection_reason: finalReason, rejection_type: mode } : s));
      if (shop.email) {
        await sendContributionStatusEmail(shop.email, shop.name, 'rejected', finalReason, mode);
        if (mode === 'warning') {
          const banResult = await serverBan({ action: 'warn', email: shop.email, user_id: shop.user_id });
          if (banResult.error) console.error('Warn error:', banResult.error);
          if (banResult.isBanned) await sendBanEmail(shop.email);
        }
      }
    }
    showToast('Rejected', 'ok');
    fetchData();
  };

  // ── RE-APPROVE rejected shop ──
  const handleReApprove = async (shop: any) => {
    showToast('Re-approving...', 'load');
    const result = await serverShop({
      action: 'update_shop_status',
      shop_id: shop.id,
      patch: { status: 'approved', rejection_reason: null, rejection_type: null },
    });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: 'approved', rejection_reason: null, rejection_type: null } : s));
    if (shop.email) await sendContributionStatusEmail(shop.email, shop.name, 'approved');
    showToast('✓ Re-approved: ' + shop.name, 'ok');
    fetchData();
  };

  // ── DELETE shop ──
  const handleDelete = async (shop: any) => {
    if (!confirm('Delete "' + shop.name + '" permanently?')) return;
    showToast('Deleting...', 'load');
    const result = await serverShop({ action: 'delete_shop', shop_id: shop.id });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    setShops(prev => prev.filter(s => s.id !== shop.id));
    showToast('Deleted: ' + shop.name, 'ok');
    fetchData();
  };

  // ── EDIT shop save ──
  const handleEditSave = async () => {
    if (!editShop) return;
    showToast('Saving...', 'load');
    const patch: any = {
      name: editShop.name,
      brgy: editShop.brgy,
      type: editShop.type,
      contact: editShop.contact || null,
      open_time: editShop.open_time,
      close_time: editShop.close_time,
    };
    // Include lat/lng if they exist in editShop
    if (editShop.lat != null) patch.lat = editShop.lat;
    if (editShop.lng != null) patch.lng = editShop.lng;

    const result = await serverShop({ action: 'edit_shop', shop_id: editShop.id, patch });
    if (result.error) { showToast('Error: ' + result.error, 'err'); setEditShop(null); return; }
    // Optimistic UI update
    setShops(prev => prev.map(s => s.id === editShop.id ? { ...s, ...patch } : s));
    setEditShop(null);
    showToast('✓ Shop updated!', 'ok');
    fetchData();
  };

  // ── BAN user manually (via server API to bypass RLS) ──
  const handleManualBan = async (shop: any) => {
    if (!shop.email) { showToast('No email on this shop', 'err'); return; }
    if (!confirm('Permanently ban ' + shop.email + '?')) return;
    showToast('Banning...', 'load');
    const result = await serverBan({ action: 'ban', email: shop.email, user_id: shop.user_id });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    try { await sendBanEmail(shop.email); } catch (e) {}
    showToast('✓ Banned: ' + shop.email.toUpperCase(), 'ok');
    fetchData();
  };

  // ── UNBAN user ──
  const handleUnban = async (u: any) => {
    if (!confirm('Unban ' + u.email + '?')) return;
    showToast('Unbanning...', 'load');
    const result = await serverBan({ action: 'unban', ban_record_id: u.id });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    setBannedUsers(prev => prev.map(b => b.id === u.id ? { ...b, is_banned: false, warning_count: 0, banned_at: null } : b));
    showToast('✓ Unbanned: ' + u.email, 'ok');
    fetchData();
  };

  // ── DELETE banned record ──
  const handleDeleteBanRecord = async (u: any) => {
    if (!confirm('Delete ban record for ' + u.email + '?')) return;
    showToast('Deleting...', 'load');
    const result = await serverBan({ action: 'delete_record', ban_record_id: u.id });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    setBannedUsers(prev => prev.filter(b => b.id !== u.id));
    showToast('Ban record deleted', 'ok');
    fetchData();
  };

  // ── APPROVE update & apply to shop (via server to bypass RLS) ──
  const handleApproveUpdate = async (upd: any) => {
    showToast('Approving update...', 'load');

    // Build the patch to apply to the shops table
    const patch: any = {};
    if (upd.updated_name)                                         patch.name       = upd.updated_name;
    if (upd.updated_brgy)                                         patch.brgy       = upd.updated_brgy;
    if (upd.updated_type)                                         patch.type       = upd.updated_type;
    if (upd.updated_contact !== undefined && upd.updated_contact !== null)
                                                                  patch.contact    = upd.updated_contact;
    if (upd.updated_open_time  != null)                           patch.open_time  = upd.updated_open_time;
    if (upd.updated_close_time != null)                           patch.close_time = upd.updated_close_time;
    if (upd.updated_work_days  != null)                           patch.work_days  = upd.updated_work_days;
    if (upd.updated_lat != null)                                  patch.lat        = upd.updated_lat;
    if (upd.updated_lng != null)                                  patch.lng        = upd.updated_lng;

    const result = await serverShop({
      action: 'approve_update',
      shop_id: upd.shop_id,
      update_id: upd.id,
      patch,
    });

    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }

    // Optimistic UI updates
    setUpdates(prev => prev.map(u => u.id === upd.id ? { ...u, status: 'approved' } : u));
    if (Object.keys(patch).length > 0) {
      setShops(prev => prev.map(s => s.id === upd.shop_id ? { ...s, ...patch } : s));
    }

    if (upd.email) await sendContributionStatusEmail(upd.email, upd.updated_name || upd.original_name, 'approved');
    showToast('✓ Update approved & applied!', 'ok');
    fetchData();
  };

  // ── REJECT update ──
  const handleRejectUpdate = (upd: any) => {
    openRejectModal(upd, 'standard', true);
  };

  // ── DELETE update record ──
  const handleDeleteUpdate = async (upd: any) => {
    if (!confirm('Delete this update record?')) return;
    showToast('Deleting...', 'load');
    const result = await serverShop({ action: 'delete_update', update_id: upd.id });
    if (result.error) { showToast('Error: ' + result.error, 'err'); return; }
    setUpdates(prev => prev.filter(u => u.id !== upd.id));
    showToast('Update record deleted', 'ok');
    fetchData();
  };

  // ── Auth screen ──
  if (!adminAuthed) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1a3a3a] text-center">
      <img src="/assets/kumpuni-go-logo.png" alt="Logo" className="w-20 h-20 rounded-full mb-6 object-cover" />
      <h1 className="text-white font-black text-xl uppercase italic mb-1">Admin Panel</h1>
      <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">Kumpuni Go</p>
      <input type="password" placeholder="Admin Password" value={adminPass}
        onChange={e => setAdminPass(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { if (adminPass === ADMIN_PASSWORD) setAdminAuthed(true); else alert('Wrong password'); } }}
        className="w-full max-w-xs p-4 rounded-2xl font-bold mb-4 text-center text-[#1a3a3a] bg-white outline-none" />
      <button onClick={() => { if (adminPass === ADMIN_PASSWORD) setAdminAuthed(true); else alert('Wrong password'); }}
        className="w-full max-w-xs bg-[#27ae60] text-white py-4 rounded-2xl font-black uppercase shadow-lg">
        Enter Admin
      </button>
    </div>
  );

  const TABS = [
    { id: 'pending'  as Tab, label: `Pending (${pending.length})`,                              color: 'bg-amber-500' },
    { id: 'approved' as Tab, label: `Approved (${approved.length})`,                            color: 'bg-[#27ae60]' },
    { id: 'rejected' as Tab, label: `Rejected (${rejected.length})`,                            color: 'bg-red-500' },
    { id: 'updates'  as Tab, label: `Updates (${updates.length})`,                              color: 'bg-blue-500' },
    { id: 'banned'   as Tab, label: `Banned (${bannedUsers.filter(b => b.is_banned).length})`,  color: 'bg-gray-700' },
  ];

  const filteredShops =
    tab === 'pending'  ? pending  :
    tab === 'approved' ? approved :
    tab === 'rejected' ? rejected : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="bg-[#1a3a3a] px-5 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/assets/kumpuni-go-logo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <h1 className="text-white font-black text-sm uppercase italic">Admin Panel</h1>
            <p className="text-gray-400 text-[10px] font-bold">Kumpuni Go</p>
          </div>
        </div>
        <button onClick={() => { showToast('Refreshing...', 'load'); fetchData().then(() => showToast('Refreshed', 'ok')); }}
          className="text-gray-400 active:text-white p-1">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full font-black text-[10px] uppercase whitespace-nowrap ${tab === t.id ? t.color + ' text-white' : 'bg-gray-100 text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Evidence lightbox */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6" onClick={() => setSelectedEvidence(null)}>
          <img src={selectedEvidence} alt="Evidence" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              {rejectModal.mode === 'warning' ? <AlertTriangle size={18} className="text-amber-500" /> : <XCircle size={18} className="text-red-400" />}
              <h2 className="font-black text-[#1a3a3a] uppercase text-sm">
                {rejectModal.mode === 'warning' ? '⚠️ Warning Rejection' : 'Standard Rejection'}
              </h2>
            </div>
            <p className="text-[#1a3a3a] font-black text-sm">
              {rejectModal.isUpdate ? (rejectModal.shop.updated_name || rejectModal.shop.original_name) : rejectModal.shop.name}
            </p>
            <div className="space-y-2">
              {(rejectModal.mode === 'warning' ? WARN_REASONS : STANDARD_REASONS).map(r => (
                <button key={r} type="button" onClick={() => setRejectReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] border ${rejectReason === r ? 'bg-[#27ae60] text-white border-[#27ae60]' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                  {r}
                </button>
              ))}
            </div>
            {rejectReason === 'Custom reason...' && (
              <input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Enter custom reason..."
                className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none" />
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={handleRejectSubmit}
                className={`py-3 rounded-xl font-black text-sm text-white ${rejectModal.mode === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}>
                Confirm Reject
              </button>
              <button onClick={() => setRejectModal(null)} className="bg-gray-100 py-3 rounded-xl font-black text-sm text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit shop modal */}
      {editShop && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-[#1a3a3a] uppercase text-sm">Edit Shop</h2>
            <input value={editShop.name || ''} placeholder="Shop Name"
              onChange={e => setEditShop({ ...editShop, name: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none" />
            <input value={editShop.brgy || ''} placeholder="Barangay / Address"
              onChange={e => setEditShop({ ...editShop, brgy: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none" />
            <input value={editShop.contact || ''} placeholder="Contact (09XXXXXXXXX)"
              onChange={e => setEditShop({ ...editShop, contact: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none" />
            <select value={editShop.type || ''} onChange={e => setEditShop({ ...editShop, type: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl font-bold text-xs border border-gray-100">
              <option value="Vulcanizing">Vulcanizing</option>
              <option value="Motorshop">Motorshop</option>
              <option value="Motorshop & Vulcanizing">Motorshop &amp; Vulcanizing</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Opens at (hour)</label>
                <input type="number" min={0} max={23} value={editShop.open_time ?? 8}
                  onChange={e => setEditShop({ ...editShop, open_time: Number(e.target.value) })}
                  className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Closes at (hour)</label>
                <input type="number" min={0} max={24} value={editShop.close_time ?? 18}
                  onChange={e => setEditShop({ ...editShop, close_time: Number(e.target.value) })}
                  className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Latitude</label>
                <input type="number" step="any" value={editShop.lat ?? ''}
                  onChange={e => setEditShop({ ...editShop, lat: e.target.value ? Number(e.target.value) : null })}
                  className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Longitude</label>
                <input type="number" step="any" value={editShop.lng ?? ''}
                  onChange={e => setEditShop({ ...editShop, lng: e.target.value ? Number(e.target.value) : null })}
                  className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm border border-gray-100 focus:outline-none mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={handleEditSave} className="bg-[#27ae60] text-white py-3 rounded-xl font-black text-sm">
                Save Changes
              </button>
              <button onClick={() => setEditShop(null)} className="bg-gray-100 py-3 rounded-xl font-black text-sm text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="p-4 space-y-4">
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-bold text-sm">Loading...</p>
          </div>
        )}

        {/* ══ BANNED TAB ══ */}
        {!loading && tab === 'banned' && (
          <div className="space-y-4">
            {bannedUsers.length === 0 && (
              <p className="text-center text-gray-300 font-black text-sm py-16">No banned users.</p>
            )}
            {bannedUsers.map(u => (
              <div key={u.id} className="bg-white rounded-[1.5rem] p-5 border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Ban size={16} className={u.is_banned ? 'text-red-500' : 'text-amber-400'} />
                  <p className="text-[#1a3a3a] font-black text-sm truncate">{u.email}</p>
                </div>
                <p className="text-gray-400 text-[11px] font-bold">
                  {u.warning_count}/3 warnings — {u.is_banned ? '🔴 BANNED' : '🟡 Warnings only'}
                </p>
                {u.banned_at && (
                  <p className="text-gray-300 text-[10px]">Banned: {new Date(u.banned_at).toLocaleDateString()}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {u.is_banned && (
                    <button onClick={() => handleUnban(u)}
                      className="flex-1 bg-[#27ae60] text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Unban User
                    </button>
                  )}
                  <button onClick={() => handleDeleteBanRecord(u)}
                    className="bg-red-50 text-red-400 py-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-1">
                    <Trash2 size={12} /> Delete Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ UPDATES TAB ══ */}
        {!loading && tab === 'updates' && (
          <div className="space-y-4">
            {updates.length === 0 && (
              <p className="text-center text-gray-300 font-black text-sm py-16">No update requests.</p>
            )}
            {updates.map(upd => (
              <div key={upd.id} className="bg-white rounded-[1.5rem] p-5 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-block font-black text-[10px] uppercase px-3 py-1 rounded-xl ${
                    upd.status === 'approved' ? 'bg-green-50 text-green-600' :
                    upd.status === 'rejected' ? 'bg-red-50 text-red-500' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {upd.status === 'pending' ? '⏳ Pending' : upd.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </span>
                  <button onClick={() => handleDeleteUpdate(upd)} className="text-gray-300 p-1 active:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-[#1a3a3a] font-black text-base">{upd.original_name}</p>

                {upd.updated_name && upd.updated_name !== upd.original_name && (
                  <p className="text-[11px] text-gray-400 font-bold">→ Name: <span className="text-[#27ae60] font-black">{upd.updated_name}</span></p>
                )}
                {upd.updated_brgy && (
                  <p className="text-[11px] text-gray-400 font-bold">→ Address: {upd.updated_brgy}</p>
                )}
                {upd.updated_contact && (
                  <p className="text-[11px] text-gray-400 font-bold">→ Contact: {upd.updated_contact}</p>
                )}
                {upd.updated_type && (
                  <p className="text-[11px] text-gray-400 font-bold">→ Type: {upd.updated_type}</p>
                )}
                {upd.updated_open_time != null && (
                  <p className="text-[11px] text-gray-400 font-bold">→ Hours: {upd.updated_open_time}:00 – {upd.updated_close_time}:00</p>
                )}
                {upd.updated_lat != null && (
                  <p className="text-[11px] text-gray-400 font-bold">→ New location: {Number(upd.updated_lat).toFixed(5)}, {Number(upd.updated_lng).toFixed(5)}</p>
                )}
                {upd.change_types && Array.isArray(upd.change_types) && upd.change_types.length > 0 && (
                  <p className="text-[11px] text-gray-500 italic">
                    {upd.change_types.map((ct: string) => {
                      if (ct === 'name')     return '🏷️ Shop Name Changed';
                      if (ct === 'location') return '📍 Shop Moved Location';
                      if (ct === 'type')     return '🔧 Shop Type Changed';
                      if (ct === 'contact')  return '📞 Contact Changed';
                      if (ct === 'hours')    return '🕐 Hours Changed';
                      if (ct === 'address')  return '🏠 Address Changed';
                      return ct;
                    }).join(', ')}
                  </p>
                )}
                {upd.update_note && (
                  <p className="text-[11px] text-gray-500 font-bold italic">{upd.update_note}</p>
                )}
                <p className="text-gray-300 text-[10px]">By: {upd.email} • {new Date(upd.created_at).toLocaleDateString()}</p>

                {upd.evidence_url && (
                  <button onClick={() => setSelectedEvidence(upd.evidence_url)}
                    className="text-[#27ae60] text-[11px] font-black block">📷 View Evidence</button>
                )}

                {upd.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleApproveUpdate(upd)}
                      className="bg-[#27ae60] text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1">
                      <CheckCircle size={14} /> Approve &amp; Apply
                    </button>
                    <button onClick={() => handleRejectUpdate(upd)}
                      className="bg-red-50 text-red-400 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ PENDING / APPROVED / REJECTED TABS ══ */}
        {!loading && (tab === 'pending' || tab === 'approved' || tab === 'rejected') && (
          <div className="space-y-4">
            {filteredShops.length === 0 && (
              <p className="text-center text-gray-300 font-black text-sm py-16">No {tab} shops.</p>
            )}
            {filteredShops.map(shop => (
              <div key={shop.id} className="bg-white rounded-[1.5rem] p-5 border border-gray-100 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1a3a3a] font-black text-base leading-tight">{shop.name}</p>
                    <p className="text-gray-400 text-[11px] font-bold mt-0.5">{shop.brgy} • {shop.type}</p>
                    {shop.contact && <p className="text-gray-400 text-[11px] font-bold mt-0.5">📞 {shop.contact}</p>}
                    <p className="text-gray-300 text-[10px] mt-0.5">📧 {shop.email}</p>
                    <p className="text-gray-300 text-[10px]">{new Date(shop.created_at).toLocaleDateString()}</p>
                    {shop.lat && (
                      <p className="text-gray-300 text-[10px]">📍 {Number(shop.lat).toFixed(5)}, {Number(shop.lng).toFixed(5)}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black border ${
                    shop.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                    shop.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {(shop.status || '').toUpperCase()}
                  </span>
                </div>

                {shop.rejection_reason && (
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <p className="text-red-500 text-[11px] font-bold">Reason: {shop.rejection_reason}</p>
                  </div>
                )}

                {shop.evidence_url && (
                  <button onClick={() => setSelectedEvidence(shop.evidence_url)}
                    className="text-[#27ae60] text-[11px] font-black block">📷 View Evidence</button>
                )}

                {/* ── Buttons per status ── */}
                <div className="flex gap-2 flex-wrap">

                  {/* PENDING actions */}
                  {shop.status === 'pending' && <>
                    <button onClick={() => handleApprove(shop)}
                      className="flex-1 bg-[#27ae60] text-white py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => openRejectModal(shop, 'standard')}
                      className="flex-1 bg-red-50 text-red-400 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <XCircle size={13} /> Reject
                    </button>
                    <button onClick={() => openRejectModal(shop, 'warning')}
                      className="flex-1 bg-amber-50 text-amber-500 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <AlertTriangle size={13} /> Warn
                    </button>
                  </>}

                  {/* APPROVED actions */}
                  {shop.status === 'approved' && <>
                    <button onClick={() => openRejectModal(shop, 'standard')}
                      className="flex-1 bg-red-50 text-red-400 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <XCircle size={13} /> Reject
                    </button>
                    <button onClick={() => handleManualBan(shop)}
                      className="flex-1 bg-gray-900 text-white py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <Ban size={13} /> Ban User
                    </button>
                  </>}

                  {/* REJECTED actions */}
                  {shop.status === 'rejected' && <>
                    <button onClick={() => handleReApprove(shop)}
                      className="flex-1 bg-[#27ae60] text-white py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <CheckCircle size={13} /> Re-Approve
                    </button>
                    <button onClick={() => handleManualBan(shop)}
                      className="flex-1 bg-gray-900 text-white py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <Ban size={13} /> Ban User
                    </button>
                  </>}

                  {/* ALL statuses: Edit + Delete */}
                  <button onClick={() => setEditShop({ ...shop })}
                    className="bg-gray-50 text-gray-500 py-2.5 px-3 rounded-xl font-black text-xs flex items-center gap-1">
                    <Edit3 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(shop)}
                    className="bg-red-50 text-red-400 py-2.5 px-3 rounded-xl flex items-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
