// src/pages/contribute/update.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { sendContributionPendingEmail, notifyAdmin } from '../../lib/mailer';
import { useRouter } from 'next/router';
import { Search, Camera, ChevronLeft, CheckCircle, Save } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CHANGE_OPTIONS = [
  { key: 'contact',  label: '📞 Contact Number Changed' },
  { key: 'hours',    label: '🕐 Hours / Days Changed' },
  { key: 'type',     label: '🔧 Shop Type Changed' },
  { key: 'name',     label: '🏷️ Shop Name Changed' },
  { key: 'location', label: '📍 Shop Moved Location' },
  { key: 'closed',   label: '🔒 Permanently Closed' },
  { key: 'other',    label: '✏️ Other (describe below)' },
];

// Sanitise a string to be safe for use in a storage path
const safeName = (s: string) =>
  s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40);

export default function UpdateShop() {
  const router = useRouter();
  const { location } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [user, setUser] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [allShops, setAllShops] = useState<any[]>([]);

  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [otherNote, setOtherNote] = useState('');

  const [leafletReady, setLeafletReady] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pinSaved, setPinSaved] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [form, setForm] = useState({
    name: '',
    brgy: '',
    municipality: '',
    province: '',
    type: '',
    contact: '',
    openTime: 8,
    closeTime: 18,
    workDays: [1, 2, 3, 4, 5, 6] as number[],
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/signin?redirect=/contribute/update'); return; }
      setUser(user);
    });
    supabase.from('shops').select('*').eq('status', 'approved').then(({ data }) => {
      if (data && data.length > 0) setAllShops(data);
    });
  }, []);

  // Load Leaflet only when "location" change is selected
  useEffect(() => {
    if (!selectedChanges.includes('location')) return;
    if ((window as any).L) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, [selectedChanges]);

  // Init map
  useEffect(() => {
    if (!leafletReady || !selectedChanges.includes('location') || !mapDivRef.current || mapRef.current) return;
    const startLat = selectedShop?.lat ?? location?.lat ?? 14.9333;
    const startLng = selectedShop?.lng ?? location?.lng ?? 120.5333;
    setPendingPin({ lat: startLat, lng: startLng });

    const L = (window as any).L;
    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView([startLat, startLng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', keepBuffer: 4 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="width:26px;height:26px;background:#f59e0b;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 3px 14px rgba(245,158,11,0.5)"></div>`,
      className: '', iconSize: [26, 26], iconAnchor: [13, 26],
    });

    const marker = L.marker([startLat, startLng], { draggable: true, icon }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setPendingPin({ lat: pos.lat, lng: pos.lng });
      setPinSaved(false);
    });
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPinSaved(false);
    });
    mapRef.current = map;
    markerRef.current = marker;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, selectedChanges]);

  // Cleanup map when location deselected
  useEffect(() => {
    if (!selectedChanges.includes('location') && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      setPinSaved(false);
      setNewPinLocation(null);
    }
  }, [selectedChanges]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'KumpuniGo/1.0' } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        setForm(f => ({
          ...f,
          municipality: (a.city || a.town || a.municipality || a.county || '').toUpperCase(),
          province: (a.state || '').toUpperCase().replace('PROVINCE OF ', '').replace(' PROVINCE', ''),
        }));
      }
    } catch { /* silent */ }
    setGeocoding(false);
  };

  const handleSavePin = () => {
    if (!pendingPin) return;
    setNewPinLocation(pendingPin);
    setPinSaved(true);
    reverseGeocode(pendingPin.lat, pendingPin.lng);
  };

  const handleTargetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPendingPin({ lat, lng });
        setPinSaved(false);
        mapRef.current?.setView([lat, lng], 18, { animate: true });
        markerRef.current?.setLatLng([lat, lng]);
      },
      undefined, { enableHighAccuracy: true }
    );
  };

  const filteredShops = allShops.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.brgy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectShop = (shop: any) => {
    setSelectedShop(shop);
    setForm({
      name: shop.name,
      brgy: shop.brgy,
      municipality: '',
      province: '',
      type: shop.type,
      contact: shop.contact || '',
      openTime: shop.open_time ?? 8,
      closeTime: shop.close_time ?? 18,
      workDays: shop.work_days ?? [1, 2, 3, 4, 5, 6],
    });
    setSelectedChanges([]);
    setEvidenceFile(null);
    setEvidencePreview(null);
  };

  const toggleChange = (key: string) => {
    setSelectedChanges(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleDay = (d: number) => {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(d) ? f.workDays.filter(x => x !== d) : [...f.workDays, d],
    }));
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !user) return;
    if (selectedChanges.length === 0) { alert('Please select what changed.'); return; }
    if (selectedChanges.includes('location') && !pinSaved) {
      alert('Please save the new pin location first.'); return;
    }
    setLoading(true);

    // ── Upload evidence photo with descriptive filename ──
    let evidence_url = '';
    if (evidenceFile) {
      try {
        setUploadProgress('Uploading evidence photo...');
        const ext = evidenceFile.name.split('.').pop() || 'jpg';
        // Filename: evidence/update_SHOPNAME_USERID_TIMESTAMP.ext
        const shopSlug = safeName(selectedShop.name);
        const fileName = `evidence/update_${shopSlug}_${user.id.slice(0, 8)}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('contributions')
          .upload(fileName, evidenceFile, { contentType: evidenceFile.type });
        if (uploadErr) {
          console.error('Evidence upload error:', uploadErr.message);
        } else if (uploadData) {
          const { data: publicUrl } = supabase.storage.from('contributions').getPublicUrl(fileName);
          evidence_url = publicUrl.publicUrl;
        }
        setUploadProgress(null);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadProgress(null);
      }
    }

    const changeLabels = selectedChanges.map(k => CHANGE_OPTIONS.find(o => o.key === k)?.label ?? k);
    const updateNote = [
      changeLabels.join(', '),
      otherNote ? `Note: ${otherNote}` : '',
    ].filter(Boolean).join(' — ');

    const newBrgy = selectedChanges.includes('location') && pinSaved
      ? [form.municipality, form.province].filter(Boolean).join(', ')
      : form.brgy;

    const insertData: any = {
      shop_id: selectedShop.id,
      original_name: selectedShop.name,
      updated_name: form.name.toUpperCase(),
      updated_brgy: newBrgy,
      updated_type: form.type,
      updated_contact: form.contact || null,
      updated_open_time: form.openTime,
      updated_close_time: form.closeTime,
      updated_work_days: form.workDays,
      update_note: updateNote,
      change_types: selectedChanges,
      evidence_url,
      status: 'pending',
      user_id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
    };

    // Only add lat/lng if shop moved
    if (selectedChanges.includes('location') && newPinLocation) {
      insertData.updated_lat = newPinLocation.lat;
      insertData.updated_lng = newPinLocation.lng;
    }

    const { error } = await supabase.from('shop_updates').insert([insertData]);

    if (!error) {
      await sendContributionPendingEmail(user.email, form.name);
      await notifyAdmin(form.name, user.email, 'update', evidence_url);
      setSubmitted(true);
    } else {
      alert('Something went wrong: ' + error.message);
    }
    setLoading(false);
  };

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
      <CheckCircle size={64} className="text-[#27ae60] mb-4" />
      <h2 className="text-2xl font-black text-[#1a3a3a] uppercase italic mb-2">Update Submitted!</h2>
      <p className="text-gray-400 font-bold text-sm mb-2">
        Your update for <strong>&quot;{selectedShop?.name}&quot;</strong> is pending review.
      </p>
      <p className="text-gray-400 text-xs mb-8">📧 Confirmation sent to <strong>{user?.email}</strong></p>
      <button onClick={() => router.push('/')}
        className="w-full max-w-xs bg-[#27ae60] text-white py-4 rounded-2xl font-black uppercase">
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-50 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft size={22} /></button>
        <h1 className="text-[#1a3a3a] font-black text-base uppercase italic">Update Shop</h1>
      </div>

      <div className="p-5 space-y-4">
        {!selectedShop ? (
          <>
            <p className="text-gray-400 text-xs font-bold uppercase">Search and select the shop to update:</p>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search shop name or barangay..."
                className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-sm font-bold text-[#1a3a3a] border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
            </div>
            <div className="space-y-3">
              {filteredShops.slice(0, 15).map(shop => (
                <button key={shop.id} onClick={() => selectShop(shop)}
                  className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 active:bg-gray-50">
                  <p className="text-[#1a3a3a] font-black text-sm uppercase">{shop.name}</p>
                  <p className="text-gray-400 text-[11px] font-bold">{shop.brgy} • {shop.type}</p>
                </button>
              ))}
              {filteredShops.length === 0 && (
                <p className="text-center text-gray-300 font-bold text-sm py-8">No shops found.</p>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-[#27ae60] uppercase">Updating:</p>
              <p className="text-[#1a3a3a] font-black uppercase">{selectedShop.name}</p>
              <button type="button" onClick={() => { setSelectedShop(null); setSelectedChanges([]); }}
                className="text-[10px] text-gray-400 underline mt-1">Change shop</button>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase pl-1 block mb-2">
                What Changed? (select all that apply)
              </label>
              <div className="space-y-2">
                {CHANGE_OPTIONS.map(opt => (
                  <button key={opt.key} type="button" onClick={() => toggleChange(opt.key)}
                    className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-[11px] border transition-all ${
                      selectedChanges.includes(opt.key)
                        ? 'bg-[#27ae60] text-white border-[#27ae60]'
                        : 'bg-white text-gray-600 border-gray-100'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {selectedChanges.includes('other') && (
                <textarea placeholder="Describe what else changed..." value={otherNote}
                  onChange={e => setOtherNote(e.target.value)} rows={2}
                  className="w-full mt-2 p-4 bg-white rounded-2xl font-bold text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60] resize-none" />
              )}
            </div>

            {/* ── MOVE LOCATION MAP ── */}
            {selectedChanges.includes('location') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1 block">📍 New Shop Location</label>
                <div className="bg-[#1a3a3a] rounded-2xl p-3">
                  <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
                    Drag the amber pin or tap the map to mark the new location. Then tap <span className="text-[#f59e0b]">Save Location</span>.
                  </p>
                </div>
                <div className="relative rounded-[1.5rem] overflow-hidden border-2 border-amber-200 shadow-md" style={{ height: '260px' }}>
                  <div ref={mapDivRef} style={{ width: '100%', height: '100%', background: '#e8f4e8' }} />
                  {!leafletReady && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button type="button" onClick={handleTargetLocation}
                    className="absolute top-3 right-3 z-[1000] bg-white rounded-full p-2.5 shadow-lg border border-gray-200 active:scale-95">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3" fill="#f59e0b" />
                      <circle cx="12" cy="12" r="8" />
                      <line x1="12" y1="2" x2="12" y2="5" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="5" y2="12" />
                      <line x1="19" y1="12" x2="22" y2="12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 z-[1000] flex justify-center">
                    <button type="button" onClick={handleSavePin}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[11px] uppercase shadow-lg transition-all active:scale-95 ${
                        pinSaved ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border-2 border-amber-400'
                      }`}>
                      <Save size={14} />
                      {pinSaved ? '✓ Location Saved' : 'Save Location'}
                    </button>
                  </div>
                </div>
                {geocoding && <p className="text-[10px] text-amber-500 font-bold pl-1 animate-pulse">📡 Getting address...</p>}
                {pinSaved && !geocoding && (
                  <>
                    <p className="text-[10px] text-amber-500 font-bold pl-1">📍 New location saved — address auto-filled ✓</p>
                    <input placeholder="MUNICIPALITY / CITY" value={form.municipality}
                      onChange={e => setForm({ ...form, municipality: e.target.value.toUpperCase() })}
                      className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
                    <input placeholder="PROVINCE" value={form.province}
                      onChange={e => setForm({ ...form, province: e.target.value.toUpperCase() })}
                      className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
                  </>
                )}
              </div>
            )}

            {selectedChanges.includes('name') && (
              <input placeholder="NEW SHOP NAME *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
            )}

            {selectedChanges.includes('type') && (
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full p-4 bg-white rounded-2xl font-black uppercase text-xs border border-gray-100 focus:outline-none focus:border-[#27ae60]">
                <option value="Vulcanizing">🔧 Vulcanizing Shop</option>
                <option value="Motorshop">🏍️ Motorshop</option>
                <option value="Motorshop & Vulcanizing">⚙️ Motorshop &amp; Vulcanizing</option>
              </select>
            )}

            {selectedChanges.includes('contact') && (
              <input placeholder="NEW CONTACT NUMBER (09XXXXXXXXX)" value={form.contact}
                onChange={e => { if (e.target.value.length <= 11) setForm({ ...form, contact: e.target.value }); }}
                type="tel" maxLength={11}
                className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
            )}

            {selectedChanges.includes('hours') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Opens at</label>
                    <select value={form.openTime} onChange={e => setForm({ ...form, openTime: Number(e.target.value) })}
                      className="w-full p-3 bg-white rounded-2xl font-bold text-sm border border-gray-100 mt-1">
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12:00 AM (24h)' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Closes at</label>
                    <select value={form.closeTime} onChange={e => setForm({ ...form, closeTime: Number(e.target.value) })}
                      className="w-full p-3 bg-white rounded-2xl font-bold text-sm border border-gray-100 mt-1">
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 || i === 24 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Work Days</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          form.workDays.includes(i) ? 'bg-[#27ae60] text-white' : 'bg-gray-100 text-gray-400'
                        }`}>{day}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Evidence Photo ── */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Evidence Photo (optional)</label>
              <div className="bg-blue-50 rounded-2xl p-3 mt-1 mb-2">
                <p className="text-blue-600 text-[11px] font-bold leading-relaxed">
                  📸 Upload a photo showing the change to help the admin verify faster.
                  The photo is stored under the shop name so the admin can identify it easily.
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleEvidenceChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="mt-1 w-full border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden active:bg-gray-50">
                {evidencePreview ? (
                  <div className="relative">
                    <img src={evidencePreview} alt="Evidence" className="w-full max-h-48 object-cover" />
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><Camera size={14} className="text-white" /></div>
                    <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1">
                      <span className="text-white text-[10px] font-bold">Tap to change photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 p-6">
                    <Camera size={28} />
                    <span className="text-[11px] font-black uppercase">Tap to Upload Photo</span>
                    <span className="text-[10px]">Photo showing the change</span>
                  </div>
                )}
              </button>
              {uploadProgress && (
                <p className="text-[10px] text-[#27ae60] font-bold pl-1 mt-1 animate-pulse">{uploadProgress}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase text-sm shadow-lg transition-all ${
                loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-amber-500 text-white shadow-amber-200 active:scale-95'
              }`}>
              {loading ? 'Submitting...' : 'Submit Update'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
