// src/components/ui/LoadingScreen.tsx
import React, { useEffect, useState } from 'react';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(20);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showCopyFallback, setShowCopyFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + 10));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const detected = /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|Messenger|\[FB\]/i.test(ua);
    setIsInAppBrowser(detected);
  }, []);

  const handleOpenInBrowser = () => {
    const url = window.location.href;
    const host = window.location.host;
    const path = window.location.pathname + window.location.search + window.location.hash;

    // ── Method 1: Android intent via anchor click ──
    // Creates a real DOM click (user-gesture), more likely to pass FB's restrictions
    try {
      const intentUrl =
        `intent://${host}${path}` +
        `#Intent;scheme=https;` +
        `action=android.intent.action.VIEW;` +
        `category=android.intent.category.BROWSABLE;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end`;

      const a = document.createElement('a');
      a.href = intentUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) { /* ignore */ }

    // ── Method 2: window.open with _system (Cordova / hybrid fallback) ──
    setTimeout(() => {
      if (document.hidden) return; // Method 1 already worked
      try { window.open(url, '_system'); } catch (_) { /* ignore */ }
    }, 600);

    // ── Method 3: window.open _blank ──
    setTimeout(() => {
      if (document.hidden) return;
      try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (_) { /* ignore */ }
    }, 1000);

    // ── Fallback: show copy-link UI if still on the page ──
    setTimeout(() => {
      if (!document.hidden) setShowCopyFallback(true);
    }, 1600);
  };

  const handleCopy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // Manual select fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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

      {/* Title */}
      <h1 className="text-3xl font-black leading-tight mb-1">
        <span className="text-white italic">Kumpuni</span>
        <span className="text-[#27ae60] italic">Go!</span>
      </h1>

      <p className="text-white/20 text-[11px] font-black uppercase tracking-widest mb-10">
        Find Nearest · Vulcanizing · Motorshop
      </p>

      <p className="text-green-400 font-bold text-sm mb-4">Detecting your location...</p>

      <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#27ae60] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
        Find Shops · Navigate · Contribute
      </p>

      {/* ── In-App Browser Banner ── */}
      {isInAppBrowser && !showCopyFallback && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a2e2e] border-t border-white/10 rounded-t-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-400 text-lg">📍</span>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-1">Inaccurate Location Detected</p>
              <p className="text-white/60 text-xs font-bold leading-relaxed">
                You&apos;re inside <span className="text-white font-black">Facebook</span>&apos;s browser.
                GPS is limited here — tap{' '}
                <span className="text-[#27ae60] font-black">Go Now</span> to open in your
                device&apos;s browser for precise location.
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

      {/* ── Copy-Link Fallback (shown when all redirect methods fail) ── */}
      {isInAppBrowser && showCopyFallback && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a2e2e] border-t border-white/10 rounded-t-3xl p-6 shadow-2xl">
          <p className="text-white font-black text-sm mb-1">Open Manually in Your Browser</p>
          <p className="text-white/50 text-xs font-bold leading-relaxed mb-4">
            Facebook blocked the redirect. Copy the link below and paste it in Chrome or your default browser.
          </p>

          {/* URL box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-4 break-all">
            <p className="text-[#27ae60] text-xs font-black select-all">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCopyFallback(false)}
              className="flex-1 py-3 rounded-2xl border border-white/20 text-white/70 font-black text-sm"
            >
              ‹ Back
            </button>
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                copied
                  ? 'bg-white/20 text-white/70'
                  : 'bg-[#27ae60] text-white shadow-lg shadow-green-900/40'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};