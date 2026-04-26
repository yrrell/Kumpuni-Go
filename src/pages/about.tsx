// src/pages/about.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, Mail, Globe, Facebook, X } from 'lucide-react';

const FEATURES = [
  { emoji: '📍', title: 'Find Nearby Shops', desc: 'Locate the nearest vulcanizing and motor shops, sorted by open status and distance from you.' },
  { emoji: '🗺️', title: 'Live Interactive Map', desc: 'View all approved shops pinned on a live map with type icons and open/closed status.' },
  { emoji: '📝', title: 'Community Contributions', desc: 'Registered users can submit new shops with a photo as proof for admin review.' },
  { emoji: '✅', title: 'Admin Verified Listings', desc: 'Every submission is reviewed by an admin before appearing in the app.' },
  { emoji: '🔔', title: 'Email Notifications', desc: 'Contributors receive email updates when their shop is approved or rejected.' },
  { emoji: '🛡️', title: 'Anti-Scam System', desc: 'Google sign-in required. A 3-strike warning system bans repeat fake submitters.' },
  { emoji: '✏️', title: 'Shop Updates', desc: 'Users can request corrections to existing shop info reviewed before going live.' },
  { emoji: '🌍', title: 'Nationwide Coverage', desc: 'Built for the Philippines and designed to scale nationally as the community grows.' },
];

export default function About() {
  const router = useRouter();
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">

      {/* ── GCash QR Modal ── */}
      {showQR && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-6 w-full max-w-xs flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <p className="text-[#1a3a3a] font-black text-sm uppercase tracking-widest">GCash QR</p>
              <button onClick={() => setShowQR(false)} className="text-gray-400 active:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src="/assets/gcash-qr.png"
                alt="GCash QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-gray-400 text-[11px] font-bold mt-4 text-center leading-relaxed">
              Open your GCash app and scan this QR code to send a donation. Thank you! 💚
            </p>
            <p className="text-[#1a3a3a] font-black text-xs mt-2">JO*N LE**Y T.</p>
          </div>
        </div>
      )}

      {/* ── Sticky Header ── */}
      <div className="bg-[#1a3a3a] px-5 py-4 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-gray-400 active:text-white p-1">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-black text-base uppercase italic">About</h1>
      </div>

      {/* ── Hero ── */}
      <div className="bg-[#1a3a3a] px-5 pb-10 pt-2 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-4 overflow-hidden">
          <img src="/assets/kumpuni-go-logo.png" alt="Kumpuni Go" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white font-black text-3xl italic tracking-tight">Kumpuni Go!</h1>
        <div className="mt-3 bg-[#27ae60]/20 border border-[#27ae60]/40 px-4 py-1.5 rounded-full">
          <span className="text-[#27ae60] text-[11px] font-black tracking-widest uppercase">Version 1.0.0</span>
        </div>
        <p className="text-gray-400 text-[12px] font-bold mt-4 max-w-xs leading-relaxed">
          Your community-powered guide to finding the nearest vulcanizing and motor repair shops anywhere in the Philippines.
        </p>
      </div>

      <div className="p-5 space-y-4 -mt-4">

        {/* ── About ── */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
          <h2 className="text-[#1a3a3a] font-black text-xs uppercase tracking-widest mb-3">About This App</h2>
          <p className="text-gray-500 text-[12px] font-bold leading-relaxed">
            Kumpuni Go is a community-driven platform that helps riders and commuters quickly find
            the nearest vulcanizing shops and motor repair shops. Whether you have a flat tire
            on the road or need engine work done, Kumpuni Go connects you to local shops
            contributed and verified by real people in your community.
          </p>
          <p className="text-gray-500 text-[12px] font-bold leading-relaxed mt-3">
            All shop listings go through admin review to ensure accuracy and prevent fake entries,
            keeping the directory trustworthy and useful for everyone.
          </p>
        </div>

        {/* ── Features ── */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
          <h2 className="text-[#1a3a3a] font-black text-xs uppercase tracking-widest mb-4">Features</h2>
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-base">{f.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#1a3a3a] font-black text-[12px]">{f.title}</p>
                  <p className="text-gray-400 text-[11px] font-bold leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Developer ── */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
          <h2 className="text-[#1a3a3a] font-black text-xs uppercase tracking-widest mb-4">Developer</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1a3a3a] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              <img
                src="/assets/developer.png"
                alt="Developer Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-[#1a3a3a] font-black text-sm">John Lerry V. Teodoro</p>
              <p className="text-gray-400 text-[11px] font-bold">Kapampangan Junior Web Developer</p>
              <p className="text-[#27ae60] text-[11px] font-bold mt-0.5">jlerryteodoro@gmail.com</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-2xl p-3">
            <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
              Built with Next.js, Supabase, Leaflet, Tailwind CSS, and Nodemailer.
              Designed and developed as a community service project for Filipino riders.
            </p>
          </div>
        </div>

        {/* ── Connect ── */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
          <h2 className="text-[#1a3a3a] font-black text-xs uppercase tracking-widest mb-4">Connect</h2>
          <div className="space-y-3">

            <a href="mailto:kumpunigo@gmail.com"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-all">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <Mail size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-[#1a3a3a] font-black text-xs">Kumpuni Go Email Support</p>
                <p className="text-gray-400 text-[10px] font-bold">kumpunigo@gmail.com</p>
              </div>
              <ChevronLeft size={14} className="text-gray-300 ml-auto rotate-180" />
            </a>

            <a href="https://kumpuni-go.vercel.app/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-all">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Globe size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[#1a3a3a] font-black text-xs">Vercel</p>
                <p className="text-gray-400 text-[10px] font-bold">kumpuni-go.vercel.app</p>
              </div>
              <ChevronLeft size={14} className="text-gray-300 ml-auto rotate-180" />
            </a>

            <a href="https://www.facebook.com/share/16pTW3h2pU/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-all">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Facebook size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[#1a3a3a] font-black text-xs">JLerry Vitug Teodoro</p>
                <p className="text-gray-400 text-[10px] font-bold">facebook.com</p>
              </div>
              <ChevronLeft size={14} className="text-gray-300 ml-auto rotate-180" />
            </a>

            <button
              onClick={() => setShowQR(true)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-all">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="24" fill="#007DFE"/>
                  <path d="M34 24.5h-9v-2h6.8A8.5 8.5 0 1 0 24 32.5v-4h2v6a10.5 10.5 0 1 1 8-10z" fill="white"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[#1a3a3a] font-black text-xs">Support via GCash</p>
                <p className="text-gray-400 text-[10px] font-bold">Tap to show QR code</p>
              </div>
              <ChevronLeft size={14} className="text-gray-300 ml-auto rotate-180" />
            </button>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center space-y-1 py-2">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
            Kumpuni Go v1.0.0
          </p>
          <p className="text-gray-500 text-[10px] font-bold">
            Built in Pampanga. For every Filipino Riders. 🇵🇭
          </p>
          <p className="text-gray-500 text-[9px] font-bold">
            © 2026 John Lerry V. Teodoro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}