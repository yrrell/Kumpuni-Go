// src/components/ui/LoadingScreen.tsx
import React, { useEffect, useState } from 'react';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + 10));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f1f1f] flex flex-col items-center justify-center z-50 px-10">

      {/* Logo Icon */}
      <div className="w-20 h-20 bg-[#27ae60] rounded-2xl flex items-center justify-center shadow-2xl shadow-green-900 mb-6">
        <span className="text-4xl">🔧</span>
      </div>

      {/* Name Label — GetGas style */}
      <h1 className="text-3xl font-black leading-tight mb-1">
        <span className="text-white">Kumpuni</span>
        <span className="text-[#27ae60]">Go!</span>
      </h1>

      <p className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-10">
        Vulcanizing · Motor Repair · Philippines
      </p>

      {/* Status */}
      <p className="text-green-400 font-bold text-sm mb-4">Detecting your location...</p>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#27ae60] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
        Find Shops · Navigate · Contribute
      </p>
    </div>
  );
};