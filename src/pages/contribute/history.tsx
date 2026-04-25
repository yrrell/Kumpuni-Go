// src/pages/contribute/history.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { ChevronLeft, CheckCircle, XCircle, Clock, RefreshCw, Edit3 } from 'lucide-react';

export default function ContributionHistory() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/signin?redirect=/contribute/history'); return; }
      setUser(user);

      const { data: shopData } = await supabase
        .from('shops').select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false });
      setShops(shopData || []);

      const { data: banData } = await supabase
        .from('banned_users').select('*').eq('email', user.email).single();
      if (banData) setBanInfo(banData);

      setLoading(false);
    });
  }, []);

  const handleRestore = (shop: any) => {
    router.push(`/contribute/add?restore=${shop.id}`);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle size={18} className="text-green-500" />;
    if (status === 'rejected') return <XCircle size={18} className="text-red-400" />;
    return <Clock size={18} className="text-amber-400" />;
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved') return 'bg-green-50 text-green-600 border-green-100';
    if (status === 'rejected') return 'bg-red-50 text-red-500 border-red-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-50 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-gray-400 p-1"><ChevronLeft size={22} /></button>
        <h1 className="text-[#1a3a3a] font-black text-base uppercase italic">My Contributions</h1>
      </div>

      <div className="p-5 space-y-4">
        {/* Ban Warning Banner */}
        {banInfo && (
          <div className={`rounded-2xl p-4 ${banInfo.is_banned ? 'bg-red-50 border border-red-200' : banInfo.warning_count > 0 ? 'bg-amber-50 border border-amber-200' : ''}`}>
            {banInfo.is_banned ? (
              <>
                <p className="text-red-600 font-black text-sm uppercase">🚫 Account Banned</p>
                <p className="text-red-500 text-[11px] font-bold mt-1">Your account is permanently banned due to repeated fake submissions.</p>
              </>
            ) : banInfo.warning_count > 0 ? (
              <>
                <p className="text-amber-600 font-black text-sm uppercase">⚠️ {banInfo.warning_count}/3 Warnings</p>
                <p className="text-amber-500 text-[11px] font-bold mt-1">
                  {3 - banInfo.warning_count} more fake submission{3 - banInfo.warning_count !== 1 ? 's' : ''} will result in a permanent ban.
                </p>
              </>
            ) : null}
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-bold text-sm">Loading...</p>
          </div>
        )}

        {!loading && shops.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-300 font-black text-sm">No contributions yet.</p>
            <button onClick={() => router.push('/contribute/add')}
              className="mt-4 bg-[#27ae60] text-white py-3 px-6 rounded-2xl font-black uppercase text-sm">
              Add Your First Shop
            </button>
          </div>
        )}

        {shops.map((shop) => (
          <div key={shop.id} className="bg-white rounded-[1.5rem] p-5 border border-gray-100 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getStatusIcon(shop.status)}
                  <p className="text-[#1a3a3a] font-black text-base leading-tight">{shop.name}</p>
                </div>
                <p className="text-gray-400 text-[11px] font-bold mt-1">{shop.brgy} • {shop.type}</p>
                <p className="text-gray-300 text-[10px]">
                  {shop.created_at ? new Date(shop.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                </p>
              </div>
              <span className={`flex-shrink-0 px-2 py-1 rounded-full text-[8px] font-black border ${getStatusStyle(shop.status)}`}>
                {shop.status?.toUpperCase()}
              </span>
            </div>

            {shop.status === 'rejected' && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-red-500 text-[10px] font-bold">
                  {shop.rejection_type === 'warning' ? '⚠️ Warning: ' : '❌ Reason: '}
                  {shop.rejection_reason || 'No reason provided'}
                </p>
              </div>
            )}

            {shop.evidence_url && (
              <img src={shop.evidence_url} alt="Evidence" className="w-full max-h-32 object-cover rounded-xl" />
            )}

            {/* Restore button for rejected shops */}
            {shop.status === 'rejected' && shop.rejection_type !== 'warning' && (
              <button onClick={() => handleRestore(shop)}
                className="w-full bg-[#1a3a3a] text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Edit3 size={14} /> Re-edit & Resubmit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
