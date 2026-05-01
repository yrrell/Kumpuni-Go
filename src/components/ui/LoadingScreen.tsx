// src/components/ui/LoadingScreen.tsx
import React, { useEffect, useState } from 'react';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(20);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + 10));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isFB =
      /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|Messenger/i.test(ua) ||
      /\bFB\b/.test(ua);
    setIsInAppBrowser(isFB);
  }, []);

  const handleOpenInBrowser = () => {
    const url = window.location.href;
    const host = window.location.host;
    const path = window.location.pathname + window.location.search + window.location.hash;

    // Android intent:// forces the OS to open in the default/Chrome browser,
    // bypassing Facebook / Messenger's in-app WebView restriction.
    const intentUrl =
      `intent://${host}${path}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;end`;

    try {
      window.location.href = intentUrl;
    } catch {
      // Fallback: copy the URL so the user can paste it manually
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      alert(`Open this link in your browser:\n\n${url}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f1f1f] flex flex-col items-center justify-center z-50 px-10">

      {/* Logo */}
      <img
        src="/kumpuni-go-logo.png"
        alt="Kumpuni Go"
        className="w-24 h-24 rounded-2xl object-cover shadow-2xl shadow-green-900 mb-6"
      />

      {/* Name Label */}
      <h1 className="text-3xl font-black leading-tight mb-1">
        <span className="text-white italic">Kumpuni</span>
        <span className="text-[#27ae60] italic">Go!</span>
      </h1>

      <p className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-10">
        Find Nearest · Vulcanizing · Motorshop
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

      {/* ── Inaccurate Location Banner (Facebook / Messenger in-app browser) ── */}
      {isInAppBrowser && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a2e2e] border-t border-white/10 rounded-t-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-400 text-lg">📍</span>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-1">Inaccurate Location Detected</p>
              <p className="text-white/60 text-xs font-bold leading-relaxed">
                You&apos;re inside <span className="text-white font-black">Facebook</span>&apos;s browser.
                GPS is limited here — tap <span className="text-[#27ae60] font-black">Go Now</span> to
                open in your device&apos;s browser for precise location.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsInAppBrowser(false)}
              className="flex-1 py-3 rounded-2xl border border-white/20 text-white/70 font-black text-sm"
            >
              ‹ Back in Facebook
            </button>
            <button
              onClick={handleOpenInBrowser}
              className="flex-1 py-3 rounded-2xl bg-[#27ae60] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 active:scale-95 transition-transform"
            >
              <span>🌐</span> Go Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
