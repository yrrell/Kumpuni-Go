// src/pages/contribute/add.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { sendContributionPendingEmail, notifyAdmin } from '../../lib/mailer';
import { useLocation } from '../../context/LocationContext';
import { useRouter } from 'next/router';
import { ChevronLeft, CheckCircle, Camera, MapPin, ExternalLink } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const safeName = (s: string) =>
  s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40);

export default function AddShop() {
  const { location } = useLocation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [user, setUser] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  // Step: 'pin' = pinning on map, 'confirm' = showing View Pin confirmation UI
  const [pinStep, setPinStep] = useState<'pin' | 'confirm'>('pin');

  const [form, setForm] = useState({
    name: '',
    municipality: '',
    province: '',
    type: 'Vulcanizing',
    contact: '',
    openTime: 8,
    closeTime: 18,
    workDays: [1, 2, 3, 4, 5, 6],
  });

  // Auth + ban check
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/signin?redirect=/contribute/add'); return; }
      setUser(user);
      const { data: banData } = await supabase
        .from('banned_users').select('is_banned').eq('email', user.email).single();
      if (banData?.is_banned) setIsBanned(true);
    });
  }, []);

  // Load Leaflet from CDN
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

  // Init Leaflet map
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;

    const lat = location?.lat ?? 14.9333;
    const lng = location?.lng ?? 120.5333;
    setPendingPin({ lat, lng });

    const L = (window as any).L;
    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      keepBuffer: 4,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="width:26px;height:26px;background:#27ae60;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 3px 14px rgba(39,174,96,0.55)"></div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setPendingPin({ lat: pos.lat, lng: pos.lng });
      setPinConfirmed(false);
      setPinStep('pin');
    });

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPinConfirmed(false);
      setPinStep('pin');
    });

    mapRef.current = map;
    markerRef.current = marker;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

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
          province: (a.state || '').toUpperCase()
            .replace('PROVINCE OF ', '').replace(' PROVINCE', ''),
        }));
      }
    } catch { /* silent */ }
    setGeocoding(false);
  };

  // Step 1: User taps "Pin Location" button — triggers geocode + shows confirm UI
  const handlePinLocation = () => {
    if (!pendingPin) return;
    setPinLocation(pendingPin);
    setPinStep('confirm');
    reverseGeocode(pendingPin.lat, pendingPin.lng);
  };

  // Open pinned location in Google Maps (linked from the OSM pin coordinates)
  const handleViewPin = () => {
    if (!pendingPin) return;
    const { lat, lng } = pendingPin;
    window.open(`https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=18`, '_blank');
  };

  // Step 2: Contributor confirms the location is correct
  const handleConfirmPin = () => {
    setPinConfirmed(true);
    setPinStep('pin'); // collapse back to map view
  };

  // Step 2 alt: Go back to edit pin
  const handleEditPin = () => {
    setPinStep('pin');
    setPinConfirmed(false);
  };

  const handleTargetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPendingPin({ lat, lng });
        setPinConfirmed(false);
        setPinStep('pin');
        mapRef.current?.setView([lat, lng], 18, { animate: true });
        markerRef.current?.setLatLng([lat, lng]);
      },
      undefined,
      { enableHighAccuracy: true }
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
    const reader = new FileReader();
    reader.onloadend = () => setEvidencePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isBanned) return;
    if (!form.name.trim()) { alert('Shop name is required'); return; }
    if (!pinConfirmed) { alert('Please confirm your pin location first. Tap "Pin Location" → View in Google Maps → Confirm Location.'); return; }
    setLoading(true);

    const finalLat = pinLocation?.lat ?? location?.lat ?? 14.9333;
    const finalLng = pinLocation?.lng ?? location?.lng ?? 120.5333;
    const brgy = [form.municipality, form.province].filter(Boolean).join(', ');

    // Upload evidence photo to public/assets/evidence_photo/
    let evidence_url = '';
    if (evidenceFile) {
      try {
        setUploadProgress('Uploading evidence photo...');
        const ext = evidenceFile.name.split('.').pop() || 'jpg';
        const shopSlug = safeName(form.name);
        const fileName = `evidence_photo/new_${shopSlug}_${user.id.slice(0, 8)}_${Date.now()}.${ext}`;
        const { data: up, error: upErr } = await supabase.storage
          .from('public')
          .upload(`assets/${fileName}`, evidenceFile, { upsert: true, contentType: evidenceFile.type });
        if (upErr) {
          console.error('Evidence upload error:', upErr.message);
        } else if (up) {
          evidence_url = `/assets/${fileName}`;
        }
        setUploadProgress(null);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadProgress(null);
      }
    }

    const { error } = await supabase.from('shops').insert([{
      name: form.name.toUpperCase(),
      brgy,
      municipality: form.municipality,
      province: form.province,
      type: form.type,
      contact: form.contact || null,
      lat: finalLat,
      lng: finalLng,
      open_time: form.openTime,
      close_time: form.closeTime,
      work_days: form.workDays,
      status: 'pending',
      is_approved: false,
      user_id: user.id,
      email: user.email,
      evidence_url,
      created_at: new Date().toISOString(),
    }]);

    if (!error) {
      await sendContributionPendingEmail(user.email, form.name);
      await notifyAdmin(form.name, user.email, 'new', evidence_url);
      setSubmittedName(form.name);
      setSubmitted(true);
    } else {
      alert('Submission error: ' + error.message);
    }
    setLoading(false);
  };

  // ── Banned screen ──
  if (isBanned) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1a3a3a] text-center">
      <p className="text-5xl mb-4">🚫</p>
      <h1 className="text-white font-black text-xl uppercase">Account Banned</h1>
      <p className="text-gray-400 font-bold text-sm mt-3 max-w-xs">
        Your account is permanently banned due to repeated fake submissions.
      </p>
      <button onClick={() => router.back()}
        className="mt-8 bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-sm">
        Go Back
      </button>
    </div>
  );

  // ── Success screen ──
  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f8fafc] text-center">
      <CheckCircle size={64} className="text-[#27ae60] mb-6" />
      <h2 className="text-[#1a3a3a] font-black text-2xl uppercase italic">Submitted!</h2>
      <p className="text-gray-500 font-bold text-sm mt-3 max-w-xs">
        &quot;{submittedName}&quot; is pending admin review.
      </p>
      <p className="text-gray-400 text-[11px] font-bold mt-2">
        📧 Confirmation sent to {user?.email}
      </p>
      <button onClick={() => router.push('/')}
        className="mt-8 w-full max-w-xs bg-[#27ae60] text-white px-8 py-4 rounded-2xl font-black uppercase shadow-lg shadow-green-200">
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-50 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[#1a3a3a] font-black text-base uppercase italic">Add Shop</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* ── Map instruction banner ── */}
        <div className="bg-[#1a3a3a] rounded-2xl p-4">
          <p className="text-white font-black text-xs uppercase tracking-wide mb-1">
            📍 Pin Your Shop Location
          </p>
          <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
            Drag the green pin or tap the map to set the exact location of the shop.
            An accurate pin is required for the shop to appear correctly on the live map
            after approval. Use the <span className="text-[#27ae60]">⊕ target button</span> to snap to your current GPS position.
            Then tap <span className="text-[#27ae60]">Pin Location</span> to confirm.
          </p>
        </div>

        {/* ── OSM Map ── */}
        <div className="relative rounded-[1.5rem] overflow-hidden border-2 border-[#27ae60]/20 shadow-md"
          style={{ height: '300px' }}>
          <div ref={mapDivRef} style={{ width: '100%', height: '100%', background: '#e8f4e8' }} />
          {!leafletReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {/* GPS target button */}
          <button type="button" onClick={handleTargetLocation}
            className="absolute top-3 right-3 z-[1000] bg-white rounded-full p-2.5 shadow-lg border border-gray-200 active:scale-95 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" fill="#27ae60" />
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          </button>
          {/* Pin Location button — replaces Save Location */}
          <div className="absolute bottom-3 left-0 right-0 z-[1000] flex justify-center px-3">
            <button type="button" onClick={handlePinLocation}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[11px] uppercase shadow-lg transition-all active:scale-95 ${
                pinConfirmed
                  ? 'bg-[#27ae60] text-white'
                  : 'bg-white text-[#27ae60] border-2 border-[#27ae60]'
              }`}>
              <MapPin size={14} />
              {pinConfirmed ? '✓ Location Confirmed' : 'Pin Location'}
            </button>
          </div>
        </div>

        {/* ── View Pin confirmation panel (shown after tapping Pin Location) ── */}
        {pinStep === 'confirm' && pendingPin && (
          <div className="bg-[#1a3a3a] rounded-2xl p-4 space-y-3 border-2 border-[#27ae60]/40">
            <p className="text-white font-black text-xs uppercase tracking-wide">
              📍 Verify Your Pin Location
            </p>
            <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
              Your pin is at <span className="text-[#27ae60]">{pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}</span>.
              Tap <span className="text-[#27ae60]">View Pin</span> to open Google Maps and verify the exact location matches what you pinned on the map above.
              Once you confirm it is correct, tap <span className="text-[#27ae60]">Confirm Location</span>.
            </p>
            {/* View Pin button — opens Google Maps at OSM pin coordinates */}
            <button type="button" onClick={handleViewPin}
              className="w-full flex items-center justify-center gap-2 bg-[#27ae60] text-white py-3 rounded-xl font-black text-xs uppercase active:opacity-80">
              <ExternalLink size={14} />
              View Pin in Google Maps
            </button>
            <p className="text-gray-500 text-[10px] font-bold text-center">
              Are you sure this is the correct location?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={handleConfirmPin}
                className="bg-[#27ae60] text-white py-3 rounded-xl font-black text-xs uppercase active:opacity-80">
                ✓ Yes, Confirm
              </button>
              <button type="button" onClick={handleEditPin}
                className="bg-white text-gray-600 border border-gray-200 py-3 rounded-xl font-black text-xs uppercase active:bg-gray-50">
                ← No, Edit Pin
              </button>
            </div>
          </div>
        )}

        {geocoding && (
          <p className="text-[10px] text-[#27ae60] font-bold pl-1 animate-pulse">
            📡 Getting address from pin location...
          </p>
        )}
        {pinConfirmed && !geocoding && (
          <p className="text-[10px] text-[#27ae60] font-bold pl-1">
            ✅ Pin confirmed — address auto-filled below ✓
          </p>
        )}

        {/* ── Shop Name ── */}
        <input required placeholder="SHOP NAME *" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
          className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />

        {/* ── Address (auto-filled from pin) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Address Details</label>
            <span className="text-[9px] text-[#27ae60] font-bold bg-green-50 px-2 py-0.5 rounded-full">Auto-filled from pin ✓</span>
          </div>
          <div className="w-full p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-amber-700 text-[10px] font-bold leading-snug">
              ⚠️ <strong>Barangay:</strong> Not required here — the admin will verify the exact barangay from the pin coordinates. Just make sure your pin is accurate.
            </p>
          </div>
          <input placeholder="MUNICIPALITY / CITY" value={form.municipality}
            onChange={e => setForm({ ...form, municipality: e.target.value.toUpperCase() })}
            className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
          <input placeholder="PROVINCE" value={form.province}
            onChange={e => setForm({ ...form, province: e.target.value.toUpperCase() })}
            className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
        </div>

        {/* ── Shop Type ── */}
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
          className="w-full p-4 bg-white rounded-2xl font-black uppercase text-xs border border-gray-100 focus:outline-none focus:border-[#27ae60]">
          <option value="Vulcanizing">🔧 Vulcanizing Shop</option>
          <option value="Motorshop">🏍️ Motorshop</option>
          <option value="Motorshop & Vulcanizing">⚙️ Motorshop &amp; Vulcanizing</option>
        </select>

        {/* ── Contact ── */}
        <input placeholder="CONTACT NUMBER (Optional, 09XXXXXXXXX)" value={form.contact}
          onChange={e => { if (e.target.value.length <= 11) setForm({ ...form, contact: e.target.value }); }}
          type="tel" maxLength={11}
          className="w-full p-4 bg-white rounded-2xl font-bold uppercase text-sm border border-gray-100 focus:outline-none focus:border-[#27ae60]" />

        {/* ── Hours ── */}
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

        {/* ── Work Days ── */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Work Days</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {DAYS.map((day, i) => (
              <button key={i} type="button" onClick={() => toggleDay(i)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  form.workDays.includes(i) ? 'bg-[#27ae60] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* ── Evidence Photo ── */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Evidence Photo</label>
          <div className="bg-blue-50 rounded-2xl p-3 mt-1 mb-2">
            <p className="text-blue-600 text-[11px] font-bold leading-relaxed">
              📸 Upload a clear photo of the actual shop front to help admin verify your submission faster.
              The photo will be stored under the shop name so the admin can identify it easily.
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleEvidenceChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden active:bg-gray-50">
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
                <span className="text-[10px]">Clear photo of the actual shop front</span>
              </div>
            )}
          </button>
          {uploadProgress && (
            <p className="text-[10px] text-[#27ae60] font-bold pl-1 mt-1 animate-pulse">{uploadProgress}</p>
          )}
        </div>

        {/* ── Guidelines ── */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-amber-700 font-black text-[11px] uppercase tracking-wide mb-1">⚠️ Submission Guidelines</p>
          <p className="text-amber-600 text-[10px] font-bold leading-relaxed">
            Only submit real, existing shops. Fake or duplicate submissions may result in a permanent ban.
            3 warning rejections = automatic ban. All submissions are traceable to your Google account.
          </p>
        </div>

        <button type="submit" disabled={loading || !pinConfirmed}
          className={`w-full py-4 rounded-2xl font-black uppercase text-sm shadow-lg transition-all ${
            loading || !pinConfirmed
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#27ae60] text-white shadow-green-200 active:scale-95'
          }`}>
          {loading ? 'Submitting...' : !pinConfirmed ? 'Confirm Pin Location First' : 'Submit Shop'}
        </button>

      </form>
    </div>
  );
}
