// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  locationDisplay: string;
}

export function Header({ locationDisplay }: HeaderProps) {
  const [dark, setDark] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Apply theme on toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="bg-white dark:bg-[#0f1f1f] px-5 py-3 flex items-center justify-between border-b border-gray-50 dark:border-white/10 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3">
        <img
          src="/assets/kumpuni-go-logo.png"
          alt="Kumpuni Go"
          className="w-10 h-10 rounded-xl object-cover shadow-md"
        />
        <div>
          <h1 className="font-black text-base leading-tight">
            <span className="text-[#1a3a3a] dark:text-white italic">Kumpuni</span>
            <span className="text-[#27ae60] italic">Go!</span>
          </h1>
          <p className="text-[#27ae60] text-[10px] font-black uppercase tracking-wide">
            📍 {locationDisplay || 'DETECTING...'}
          </p>
        </div>
      </div>
      <button
        onClick={() => setDark(!dark)}
        className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-full transition-all"
      >
        {dark
          ? <Sun size={13} className="text-yellow-400" />
          : <Moon size={13} className="text-gray-500" />
        }
        <span className="text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase">
          {dark ? 'Light' : 'Dark'}
        </span>
      </button>
    </header>
  );
}
