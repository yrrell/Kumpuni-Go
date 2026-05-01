// src/pages/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useLocation } from '../context/LocationContext';
import { lubaoShops } from '../data/shops-data';
import { useShopFiltering } from '../hooks/useShopFiltering';
import { supabase } from '../lib/supabase';
import { formatDistance } from '../lib/distance';
import { Phone, Navigation, MessageSquare, Search } from 'lucide-react';
import { useRouter } from 'next/router';

type CategoryFilter = 'ALL' | 'Vulcanizing' | 'Motorshop' | 'Motorshop & Vulcanizing';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { location, locationInfo, loading } = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [dbShops, setDbShops] = useState<any[]>([]);
  const [noContactAlert, setNoContactAlert] = useState<string | null>(null);
  const router = useRouter();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const shopMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);
  const activePopupShopIdRef = useRef<any>(null);

  // ── Fetch approved shops ──
  const fetchShops = useCallback(async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('status', 'approved');
    if (!error && data && data.length > 0) setDbShops(data);
  }, []);

  useEffect(() => {
    fetchShops();
    const channel = supabase
      .channel('shops-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => fetchShops())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchShops]);

  const allShops = dbShops.length > 0 ? dbShops : lubaoShops;
  const baseFiltered = useShopFiltering(allShops, location, search);
  const filtered = category === 'ALL'
    ? baseFiltered
    : baseFiltered.filter((s: any) => s.type === category);

  // ── Load Leaflet CSS+JS once ──
  useEffect(() => {
    if ((window as any).L || leafletLoadedRef.current) return;
    leafletLoadedRef.current = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(script);
  }, []);

  // ── Init Leaflet map once location is available ──
  useEffect(() => {
    if (!location || !mapDivRef.current) return;

    const tryInit = () => {
      const L = (window as any).L;
      if (!L) { setTimeout(tryInit, 300); return; }
      if (mapRef.current) {
        mapRef.current.panTo([location.lat, location.lng], { animate: false });
        userMarkerRef.current?.setLatLng([location.lat, location.lng]);
        updateShopMarkers(L);
        return;
      }

      const map = L.map(mapDivRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
      }).setView([location.lat, location.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        keepBuffer: 4,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const youIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;
          border:3px solid white;box-shadow:0 0 0 5px rgba(37,99,235,0.25)"></div>`,
        className: '', iconSize: [14, 14], iconAnchor: [7, 7],
      });
      userMarkerRef.current = L.marker([location.lat, location.lng], { icon: youIcon })
        .addTo(map)
        .bindPopup('<b style="font-family:sans-serif">📍 You are here</b>');

      map.on('popupclose', () => { activePopupShopIdRef.current = null; });

      mapRef.current = map;
      updateShopMarkers(L);
    };

    tryInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;
    updateShopMarkers(L);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  useEffect(() => {
    if (activeTab === 'map' && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 80);
    }
  }, [activeTab]);

  const updateShopMarkers = (L: any) => {
    if (!mapRef.current) return;
    const prevOpenId = activePopupShopIdRef.current;
    shopMarkersRef.current.forEach(m => m.remove());
    shopMarkersRef.current = [];

    filtered.forEach((shop: any) => {
      if (!shop.lat || !shop.lng) return;
      const isOpen = shop.isOpen;
      const bg = isOpen ? '#27ae60' : '#ef4444';
      const emoji =
        shop.type === 'Vulcanizing' ? '🔧'
        : shop.type === 'Motorshop' ? '🏍️'
        : '⚙️';

      const icon = L.divIcon({
        html: `<div style="background:${bg};color:white;font-size:13px;
          padding:4px 7px;border-radius:20px;border:2px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;
          display:flex;align-items:center;gap:3px;font-family:sans-serif;
          font-weight:900;font-size:10px">
          <span style="font-size:13px">${emoji}</span>
        </div>`,
        className: '',
        iconAnchor: [22, 12],
      });

      const popupContent = `
        <div style="font-family:sans-serif;min-width:150px;padding:2px 0">
          <b style="font-size:13px;color:inherit;text-transform:uppercase">${shop.name}</b><br/>
          <span style="font-size:11px;color:#888">${shop.brgy}</span><br/>
          <span style="font-size:10px;color:${isOpen ? '#27ae60' : '#ef4444'};font-weight:700">
            ${isOpen ? '● OPEN' : '● CLOSED'}
          </span><br/>
          <span style="font-size:10px;color:#aaa">${shop.type}</span>
        </div>
      `;

      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(popupContent, { closeOnClick: false, autoClose: false });

      marker.on('click', () => {
        if (activePopupShopIdRef.current === shop.id) {
          marker.closePopup();
          activePopupShopIdRef.current = null;
        } else {
          shopMarkersRef.current.forEach(m => m.closePopup());
          marker.openPopup();
          activePopupShopIdRef.current = shop.id;
        }
      });

      if (prevOpenId === shop.id) {
        setTimeout(() => marker.openPopup(), 50);
        activePopupShopIdRef.current = shop.id;
      }

      shopMarkersRef.current.push(marker);
    });
  };

  if (loading) return <LoadingScreen />;

  // ── Contact handlers ──
  const handleCall = (shop: any) => {
    if (!shop.contact) {
      setNoContactAlert('No contact number registered yet for this shop. The contributor may not have provided one.');
      return;
    }
    window.location.href = `tel:${shop.contact}`;
  };

  const handleSms = (shop: any) => {
    if (!shop.contact) {
      setNoContactAlert('No contact number registered yet for this shop. The contributor may not have provided one.');
      return;
    }
    window.location.href = `sms:${shop.contact}`;
  };

  const goNowUrl = (lat: number, lng: number, name: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}&travelmode=driving`;

  const getOpenTime = (s: any) => s.open_time ?? s.openTime;
  const getCloseTime = (s: any) => s.close_time ?? s.closeTime;

  const fmtHour = (h: number) => {
    if (h === 0 || h === 24) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  const CATEGORIES: { label: string; value: CategoryFilter }[] = [
    { label: 'ALL', value: 'ALL' },
    { label: 'VULCANIZING', value: 'Vulcanizing' },
    { label: 'MOTORSHOP', value: 'Motorshop' },
    { label: 'BOTH', value: 'Motorshop & Vulcanizing' },
  ];

  // ── Shop Card — shop names forced ALL CAPS ──
  const ShopCard = ({ shop }: { shop: any }) => (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-theme font-black text-lg leading-tight uppercase">
            {shop.name}
          </h4>
          <p className="text-gray-500 text-xs font-bold mt-1">
            📍 {shop.brgy} • <span className="text-[#27ae60]">{formatDistance(shop.dist)} away</span>
          </p>
          <p className="text-gray-400 text-[10px] font-bold">{shop.type}</p>
        </div>
        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black border ${
          shop.isOpen
            ? 'bg-green-50 text-green-600 border-green-100'
            : 'bg-red-50 text-red-500 border-red-100'
        }`}>
          {shop.isOpen ? '● OPEN' : '● CLOSED'}
        </div>
      </div>
      {!shop.isOpen && getOpenTime(shop) !== undefined && (
        <p className="text-[10px] text-gray-300 font-bold mt-1">
          {getOpenTime(shop) === 0 && getCloseTime(shop) === 24
            ? '24/7 Open'
            : `Opens at ${fmtHour(getOpenTime(shop))}`}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <button onClick={() => handleCall(shop)}
          className="flex flex-col items-center py-3 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl text-theme active:bg-gray-100 dark:active:bg-[#2a2a2a] transition-all">
          <Phone size={18} /><span className="text-[9px] font-black mt-1">CALL</span>
        </button>
        <button onClick={() => handleSms(shop)}
          className="flex flex-col items-center py-3 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl text-theme active:bg-gray-100 dark:active:bg-[#2a2a2a] transition-all">
          <MessageSquare size={18} /><span className="text-[9px] font-black mt-1">SMS</span>
        </button>
        <a href={goNowUrl(shop.lat, shop.lng, shop.name)}
          target="_blank" rel="noopener noreferrer"
          className="flex flex-col items-center py-3 bg-[#27ae60] text-white rounded-2xl shadow-md shadow-green-100">
          <Navigation size={18} /><span className="text-[9px] font-black mt-1">GO NOW</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-32">
      {/* Header — receives live location display from context */}
      <Header locationDisplay={locationInfo.display} />

      {/* ── No Contact Popup ── */}
      {noContactAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setNoContactAlert(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-2xl mb-3 text-center">📵</p>
            <h3 className="text-theme font-black text-base uppercase text-center mb-2">No Contact Number</h3>
            <p className="text-gray-500 text-[12px] font-bold text-center leading-relaxed">{noContactAlert}</p>
            <button onClick={() => setNoContactAlert(null)}
              className="w-full mt-5 bg-[#27ae60] text-white py-3 rounded-2xl font-black text-sm">
              OK, Got It
            </button>
          </div>
        </div>
      )}

      <main className="p-5 flex-1">

        {/* ══ HOME TAB ══ */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search Shop/Municipality/City/ Province..."
                className="w-full pl-10 pr-4 py-4 bg-white dark:bg-[#1f1f1f] rounded-2xl text-sm font-bold text-theme
                  border border-gray-100 focus:outline-none focus:border-[#27ae60]" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setCategory(cat.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full font-black text-[10px] uppercase transition-all ${
                    category === cat.value
                      ? 'bg-[#27ae60] text-white'
                      : 'bg-white text-gray-400 border border-gray-100'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <p className="text-gray-500 font-black text-xs tracking-[0.1em] uppercase pl-1">
              {filtered.length} shop{filtered.length !== 1 ? 's' : ''} — Open First, Nearest Priority
            </p>

            {filtered.length === 0 && (
              <p className="text-center text-gray-500 font-bold text-sm py-10">No shops found.</p>
            )}

            <div className="space-y-4">
              {filtered.map((shop: any) => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          </div>
        )}

        {/* ══ MAP TAB ══ */}
        <div style={{ display: activeTab === 'map' ? 'block' : 'none' }} className="space-y-4">
          <p className="text-gray-500 font-black text-xs tracking-[0.2em] uppercase pl-1">
            📍 {locationInfo.display} — Live Map
          </p>

          <div className="w-full rounded-[2rem] overflow-hidden shadow-xl border-2 border-white relative"
            style={{ height: '340px' }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '100%', background: '#e8f4e8' }} />
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm
              rounded-2xl px-3 py-2 shadow-md pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27ae60]" />
                  <span className="text-[9px] font-black text-gray-600">OPEN</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-[9px] font-black text-gray-600">CLOSED</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-black text-gray-600">YOU</span>
                </div>
              </div>
            </div>
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm
              rounded-2xl px-3 py-2 shadow-md pointer-events-none">
              <p className="text-[9px] font-black text-gray-500">🔧 Vulcanizing</p>
              <p className="text-[9px] font-black text-gray-500">🏍️ Motorshop</p>
              <p className="text-[9px] font-black text-gray-500">⚙️ Both</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-black text-[10px] uppercase transition-all ${
                  category === cat.value
                    ? 'bg-[#27ae60] text-white'
                    : 'bg-white text-gray-400 border border-gray-100'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <p className="text-gray-500 font-black text-xs tracking-[0.2em] uppercase pl-1">
            {filtered.length} Nearest Shop{filtered.length !== 1 ? 's' : ''}
          </p>

          {filtered.slice(0, 10).map((shop: any) => (
            <div key={shop.id}
              className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 flex justify-between items-center gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-theme font-black text-base leading-tight truncate uppercase">{shop.name}</h4>
                <p className="text-gray-400 text-[11px] font-bold mt-0.5">
                  {shop.brgy} • <span className="text-[#27ae60]">{formatDistance(shop.dist)}</span>
                </p>
                <p className="text-gray-500 text-[10px]">{shop.type}</p>
                <span className={`text-[9px] font-black ${shop.isOpen ? 'text-green-500' : 'text-red-400'}`}>
                  {shop.isOpen ? '● OPEN' : '● CLOSED'}
                </span>
              </div>
              <a href={goNowUrl(shop.lat, shop.lng, shop.name)}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex flex-col items-center py-3 px-4 bg-[#27ae60] text-white rounded-2xl shadow-md shadow-green-100">
                <Navigation size={18} /><span className="text-[9px] font-black mt-1">GO NOW</span>
              </a>
            </div>
          ))}
        </div>

        {/* ══ CONTRIBUTE TAB ══ */}
        {activeTab === 'contribute' && (
          <div className="space-y-4 pt-2">
            <div className="text-center pb-1">
              <h2 className="text-theme font-black text-2xl uppercase italic">Contribute</h2>
              <p className="text-gray-400 text-xs font-bold mt-1">Help your community find shops!</p>
            </div>

            <div className="bg-green-50 rounded-3xl p-5">
              <p className="text-theme font-black text-xs uppercase tracking-wide mb-2">How it works</p>
              <p className="text-gray-500 text-[11px] font-bold leading-relaxed">
                1. Sign in with Google (anti-scam verification)<br />
                2. Pin the shop on the map & fill in details<br />
                3. Submit — you&apos;ll get an email confirmation<br />
                4. Admin reviews and approves within 2–7 days<br />
                5. Approved shops go live instantly ✅
              </p>
            </div>

            <button onClick={() => router.push('/auth/signin?redirect=/contribute/add')}
              className="w-full py-4 bg-[#27ae60] text-white font-black text-sm uppercase rounded-3xl shadow-lg shadow-green-200 tracking-wide">
              + Add a Shop
            </button>
          </div>
        )}

      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
