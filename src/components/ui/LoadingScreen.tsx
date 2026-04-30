// src/components/ui/LoadingScreen.tsx
import React from 'react';

export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#1a3a3a] flex flex-col items-center justify-center z-50 p-10 text-center">
    <img src="/kumpuni-go-logo.png" className="w-28 h-28 mb-6 animate-bounce rounded-full object-cover" alt="Kumpuni Go" />
    <h1 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Kumpuni Go!</h1>
   
    <h3 className="text-green-300 font-bold text-sm mb-10">FIND THE NEAREST VULCANIZING SHOPS AND MOTOR REPAIR SHOPS</h3>
   
    <p className="text-green-300 font-bold text-sm mb-10">Detecting your location...</p>
    <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="w-[80%] h-full bg-[#27ae60] rounded-full animate-pulse" />
    </div>
    <p className="text-white/30 text-[10px] font-bold mt-6 uppercase tracking-widest">
      Find Shops · Navigate · Contribute
    </p>
  </div>
);
