// src/components/layout/Header.tsx
import React from 'react';

interface HeaderProps {
  locationDisplay: string;
}

export function Header({ locationDisplay }: HeaderProps) {
  return (
    <header className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-50 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <img src="/kumpuni-go-logo.png" alt="Kumpuni Go" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h1 className="text-[#1a3a3a] font-black text-base italic leading-tight">Kumpuni Go!</h1>
          <p className="text-[#27ae60] text-[10px] font-black uppercase tracking-wide">
            📍 {locationDisplay || 'DETECTING...'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 bg-[#27ae60] rounded-full animate-pulse" />
        <span className="text-[#27ae60] text-[10px] font-black uppercase">Online</span>
      </div>
    </header>
  );
}
