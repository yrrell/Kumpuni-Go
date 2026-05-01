// src/components/ui/InAppBrowserNotice.tsx
import React, { useEffect, useState } from 'react';

function detectPlatform() {
  if (typeof window === 'undefined') return 'android';
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) ? 'ios' : 'android';
}

function isInAppBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|Messenger|\[FB\]/i.test(ua);
}

export const InAppBrowserNotice = () => {
  const [show, setShow] = useState(false);
  const [chromeHref, setChromeHref] = useState('#');
  const [defaultHref, setDefaultHref] = useState('#');

  useEffect(() => {
    if (!isInAppBrowser()) return;
    setShow(true);

    const url  = window.location.href;
    const host = window.location.host;
    const path = window.location.pathname + window.location.search + window.location.hash;
    const platform = detectPlatform();

    if (platform === 'ios') {
      setChromeHref(`googlechromes://${host}${path}`);
      setDefaultHref(url);
    } else {
      const base = `intent://${host}${path}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(url)}`;
      setChromeHref(`${base};package=com.android.chrome;end`);
      setDefaultHref(`${base};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => setShow(false)} />

      {/* Sheet */}
      <div className="relative bg-[#1a2e2e] rounded-t-3xl p-6 shadow-2xl border-t border-white/10">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 text-lg">📍</span>
          </div>
          <div>
            <p className="text-white font-black text-sm mb-1">Inaccurate Location Detected</p>
            <p className="text-white/60 text-xs font-bold leading-relaxed">
              You&apos;re inside <span className="text-white font-black">Facebook</span>&apos;s browser.
              GPS is limited here — open in Chrome or your default browser for precise location.
            </p>
          </div>
        </div>

        {/* Browser picker */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">
            Choose a Browser
          </p>

          <div className="flex gap-4 justify-center">

            {/* Chrome */}
            <a
              href={chromeHref}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg width="34" height="34" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer colored ring */}
                  <path fill="#EA4335" d="M24 4C13 4 4 13 4 24c0 5.3 2 10.1 5.4 13.7L20.8 18H24c3.3 0 6.3 1.7 8 4.4l.1.2L44 13.3A19.9 19.9 0 0 0 24 4z"/>
                  <path fill="#FBBC05" d="M9.4 37.7A20 20 0 0 0 24 44c8.8 0 16.4-5.7 19.2-13.6L31.5 22.5A9.9 9.9 0 0 1 24 34a10 10 0 0 1-8.6-4.9L9.4 37.7z"/>
                  <path fill="#4285F4" d="M44 13.3l-11 9.3-.1-.2A10 10 0 0 0 24 18h-3.2L9.4 37.7 4 24C4 13 13 4 24 4a19.9 19.9 0 0 1 20 9.3z"/>
                  {/* White inner circle */}
                  <circle cx="24" cy="24" r="10" fill="white"/>
                  {/* Blue inner circle */}
                  <circle cx="24" cy="24" r="7" fill="#4285F4"/>
                </svg>
              </div>
              <span className="text-white text-[11px] font-black">Chrome</span>
            </a>

            {/* Default Browser */}
            <a
              href={defaultHref}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span className="text-white text-[11px] font-black">Default</span>
            </a>

          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            className="flex-1 py-3 rounded-2xl border border-white/20 text-white/60 font-black text-sm"
          >
            ‹ Back in Facebook
          </button>
          <a
            href={defaultHref}
            className="flex-1 py-3 rounded-2xl bg-[#27ae60] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Go Now
          </a>
        </div>

      </div>
    </div>
  );
};
