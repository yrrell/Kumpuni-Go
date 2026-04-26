// src/pages/contribute/update.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { sendContributionPendingEmail, notifyAdmin } from '../../lib/mailer';
import { useRouter } from 'next/router';
import { ChevronLeft, CheckCircle, Camera, Search } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CHANGE_TYPES = [
  'Hours / Days Changed',
  'Shop Type Changed',
  'Shop Name Changed',
  'Shop Moved Location',
  'Permanently Closed',
  'Other (describe below)',
];

export default function UpdateShop() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  const [shops, setShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);

  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [updateNote, setUpdateNote] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pinSaved, setPinSaved] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [form, setForm] = useState({
    updated_name: '',
    updated_brgy: '',
    updated_type: 'Vulcanizing',
    updated_contact: '',
    updated_open_time: 8,
    updated_close_time: 18,
    updated_work_days: [1, 2, 3, 4, 5, 6] as number[],
  });

  // Auth check
  useEffect(() => {
    const checkAuth = async (attempt = 0) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: banData } = await supabase
          .from('banned_users').select('is_banned').eq('email', session.user.email).single();
        if (banData?.is_banned) setIsBanned(true);
        setAuthLoading(false);
      } else if (attempt < 5) {
        setTimeout(() => checkAuth(attempt + 1), 300);
      } else {
        router.replace('/auth/signin?redirect=/contribute/update');
      }
    };
    checkAuth();
  }, []);

  // Load approved shops
  useEffect(() => {
    const loadShops = async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name, brgy, type, contact, lat, lng, open_time, close_time, work_days')
        .eq('is_approved', true)
        .order('name');
      setShops(data || []);
      setShopsLoading(false);
    };
    loadShops();
  }, []);

  // Load Leaflet
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Init map when shop is selected and map is shown
  useEffect(() => {
    if (!leafletReady || !showMap || !mapDivRef.current || mapRef.current || !selectedShop) return;

    const lat = selectedShop.lat ?? 14.9333;
    const lng = selectedShop.lng ?? 120.5333;
    setPinLocation({ lat, lng });

    const L = (window as any).L;
    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView([lat, lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:#e74c3c;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', (e: any) => {
      const { lat: newLat, lng: newLng } = e.target.getLatLng();
      setPinLocation({ lat: newLat, lng: newLng });
      setPinSaved(false);
    });

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      setPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPinSaved(false);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [leafletReady, showMap, selectedShop]);

  const handleSelectShop = (shop: any) => {
    setSelectedShop(shop);
    setForm({
      updated_name: shop.name || '',
      updated_brgy: shop.brgy || '',
      updated_type: shop.type || 'Vulcanizing',
      updated_contact: shop.contact || '',
      updated_open_time: shop.open_time ?? 8,
      updated_close_time: shop.close_time ?? 18,
      updated_work_days: shop.work_days || [1, 2, 3, 4, 5, 6],
    });
    setSelectedChanges([]);
    setUpdateNote('');
    setEvidenceFile(null);
    setEvidencePreview(null);
    setPinLocation({ lat: shop.lat, lng: shop.lng });
    setPinSaved(false);
    setShowMap(false);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
  };

  const toggleChange = (type: string) => {
    setSelectedChanges(prev =>
      prev.includes(type) ? prev.filter(c => c !== type) : [...prev, type]
    );
    if (type === 'Shop Moved Location') {
      setShowMap(prev => !selectedChanges.includes(type));
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = () => setEvidencePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedShop) return;
    if (selectedChanges.length === 0) {
      alert('Please select at least one type of change.');
      return;
    }
    if (!evidenceFile) {
      alert('Please upload a photo as evidence.');
      return;
    }

    setLoading(true);
    try {
      // Upload evidence
      const ext = evidenceFile.name.split('.').pop();
      const fileName = `updates/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('evidence').upload(fileName, evidenceFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(fileName);
      const evidenceUrl = urlData.publicUrl;

      // Submit update
      const payload: any = {
        shop_id: selectedShop.id,
        original_name: selectedShop.name,
        updated_name: form.updated_name,
        updated_brgy: form.updated_brgy,
        updated_type: form.updated_type,
        updated_contact: form.updated_contact,
        updated_open_time: form.updated_open_time,
        updated_close_time: form.updated_close_time,
        updated_work_days: form.updated_work_days,
        update_note: updateNote,
        evidence_url: evidenceUrl,
        status: 'pending',
        user_id: user.id,
        email: user.email,
        change_types: selectedChanges,
      };

      if (selectedChanges.includes('Shop Moved Location') && pinSaved && pinLocation) {
        payload.updated_lat = pinLocation.lat;
        payload.updated_lng = pinLocation.lng;
      }

      const { error: insertError } = await supabase.from('shop_updates').insert([payload]);
      if (insertError) throw insertError;

      // Send emails
      await sendContributionPendingEmail(user.email, selectedShop.name);
      await notifyAdmin(selectedShop.name, user.email, 'update', evidenceUrl);

      setSubmittedName(selectedShop.name);
      setSubmitted(true);
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.brgy || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmt = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:00 ${period}`;
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Banned
  if (isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-4xl mb-4">🚫</p>
        <h2 className="text-[#1a3a3a] font-black uppercase text-lg mb-2">Account Banned</h2>
        <p className="text-gray-400 text-sm">You are permanently banned from contributing.</p>
        <button onClick={() => router.push('/')} className="mt-6 bg-[#1a3a3a] text-white py-3 px-8 rounded-2xl font-black text-sm">
          Go Home
        </button>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <CheckCircle size={56} className="text-[#27ae60] mb-4" />
        <h2 className="text-[#1a3a3a] font-black uppercase text-xl mb-2">Update Submitted!</h2>
        <p className="text-gray-400 text-sm mb-1">
          Your update for <strong>"{submittedName}"</strong> is pending review.
        </p>
        <p className="text-gray-300 text-xs mb-1">
          Confirmation sent to {user?.email}
        </p>
        <button onClick={() => router.push('/')}
          className="mt-6 bg-[#27ae60] text-white py-4 px-8 rounded-2xl font-black uppercase text-sm">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-50 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[#1a3a3a] font-black text-base uppercase italic">Update a Shop</h1>
      </div>

      <div className="p-5 space-y-5">

        {/* Step 1: Select shop */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100">
          <p className="text-[#1a3a3a] font-black text-sm uppercase mb-3">1. Select the Shop</p>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search shop name or barangay..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none"
            />
          </div>

          {shopsLoading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredShops.map(shop => (
                <button
                  key={shop.id}
                  onClick={() => handleSelectShop(shop)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedShop?.id === shop.id
                      ? 'bg-[#27ae60] border-[#27ae60] text-white'
                      : 'bg-gray-50 border-gray-100 text-[#1a3a3a]'
                  }`}
                >
                  <p className="font-black text-sm">{shop.name}</p>
                  <p className={`text-xs font-bold ${selectedShop?.id === shop.id ? 'text-green-100' : 'text-gray-400'}`}>
                    {shop.brgy} · {shop.type}
                  </p>
                </button>
              ))}
              {filteredShops.length === 0 && (
                <p className="text-center text-gray-300 text-sm py-4 font-bold">No shops found.</p>
              )}
            </div>
          )}
        </div>

        {selectedShop && (
          <>
            {/* Step 2: What changed */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100">
              <p className="text-[#1a3a3a] font-black text-sm uppercase mb-3">2. What Changed?</p>
              <div className="space-y-2">
                {CHANGE_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleChange(type)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedChanges.includes(type)
                        ? 'bg-[#27ae60]/10 border-[#27ae60] text-[#27ae60]'
                        : 'bg-gray-50 border-gray-100 text-[#1a3a3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedChanges.includes(type) ? 'bg-[#27ae60] border-[#27ae60]' : 'border-gray-300'
                    }`}>
                      {selectedChanges.includes(type) && (
                        <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <span className="font-bold text-sm">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Updated Details */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 space-y-4">
              <p className="text-[#1a3a3a] font-black text-sm uppercase">3. Updated Details</p>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Shop Name</label>
                <input
                  value={form.updated_name}
                  onChange={e => setForm(f => ({ ...f, updated_name: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Barangay / Area</label>
                <input
                  value={form.updated_brgy}
                  onChange={e => setForm(f => ({ ...f, updated_brgy: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Shop Type</label>
                <select
                  value={form.updated_type}
                  onChange={e => setForm(f => ({ ...f, updated_type: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none mt-1"
                >
                  <option>Vulcanizing</option>
                  <option>Motorshop</option>
                  <option>Both</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Contact (optional)</label>
                <input
                  value={form.updated_contact}
                  onChange={e => setForm(f => ({ ...f, updated_contact: e.target.value }))}
                  placeholder="e.g. 09xxxxxxxxx"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none mt-1"
                />
              </div>

              {/* Hours */}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Opening Hours</label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={form.updated_open_time}
                    onChange={e => setForm(f => ({ ...f, updated_open_time: +e.target.value }))}
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-sm font-bold text-[#1a3a3a] outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{fmt(i)}</option>
                    ))}
                  </select>
                  <span className="self-center text-gray-400 font-bold">–</span>
                  <select
                    value={form.updated_close_time}
                    onChange={e => setForm(f => ({ ...f, updated_close_time: +e.target.value }))}
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-sm font-bold text-[#1a3a3a] outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{fmt(i)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Work days */}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Work Days</label>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => setForm(f => ({
                        ...f,
                        updated_work_days: f.updated_work_days.includes(i)
                          ? f.updated_work_days.filter(d => d !== i)
                          : [...f.updated_work_days, i]
                      }))}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        form.updated_work_days.includes(i)
                          ? 'bg-[#27ae60] text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* New location map */}
              {selectedChanges.includes('Shop Moved Location') && (
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase">New Shop Location</label>
                  <p className="text-gray-300 text-xs mt-1 mb-2">
                    Drag the pin or tap the map to mark the new location.
                  </p>
                  <div ref={mapDivRef} style={{ height: 220 }} className="w-full rounded-2xl overflow-hidden border border-gray-100" />
                  {pinLocation && (
                    <button
                      onClick={() => setPinSaved(true)}
                      className={`mt-2 w-full py-3 rounded-2xl font-black text-sm transition-all ${
                        pinSaved ? 'bg-[#27ae60] text-white' : 'bg-[#1a3a3a] text-white'
                      }`}
                    >
                      {pinSaved ? '✅ Location Saved' : '📍 Save Location'}
                    </button>
                  )}
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase">Additional Notes</label>
                <textarea
                  value={updateNote}
                  onChange={e => setUpdateNote(e.target.value)}
                  rows={3}
                  placeholder="Describe the changes in detail..."
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-[#1a3a3a] outline-none mt-1 resize-none"
                />
              </div>
            </div>

            {/* Step 4: Evidence */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100">
              <p className="text-[#1a3a3a] font-black text-sm uppercase mb-1">4. Upload Evidence Photo</p>
              <p className="text-gray-300 text-xs font-bold mb-3">Take a clear photo of the shop showing the change.</p>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

              {evidencePreview ? (
                <div className="relative">
                  <img src={evidencePreview} alt="Evidence" className="w-full max-h-48 object-cover rounded-2xl" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow-md"
                  >
                    <Camera size={18} className="text-[#1a3a3a]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-2 text-gray-300"
                >
                  <Camera size={28} />
                  <span className="text-xs font-black uppercase">Tap to upload photo</span>
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#27ae60] text-white py-4 rounded-2xl font-black uppercase text-sm tracking-wider disabled:opacity-60 active:scale-95 transition-all"
            >
              {loading ? 'Submitting...' : 'Submit Update'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
