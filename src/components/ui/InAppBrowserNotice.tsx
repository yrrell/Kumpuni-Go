// src/components/ui/InAppBrowserNotice.tsx
import React, { useEffect, useState } from 'react';

// ─── Detection ───────────────────────────────────────────────────────────────

function detectInAppBrowser(): { isInApp: boolean; platform: string } {
  if (typeof window === 'undefined') return { isInApp: false, platform: '' };
  const ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|FBIOS|FBDV|FBMD|FBSN|FBSV|FBSS|MessengerForiOS/i.test(ua))
    return { isInApp: true, platform: 'Facebook' };
  if (/Instagram/i.test(ua)) return { isInApp: true, platform: 'Instagram' };
  if (/musical_ly|TikTok/i.test(ua)) return { isInApp: true, platform: 'TikTok' };
  if (/Twitter/i.test(ua)) return { isInApp: true, platform: 'X (Twitter)' };
  if (/\bLine\b/i.test(ua)) return { isInApp: true, platform: 'LINE' };
  if (/MicroMessenger/i.test(ua)) return { isInApp: true, platform: 'WeChat' };
  if (/Snapchat/i.test(ua)) return { isInApp: true, platform: 'Snapchat' };
  return { isInApp: false, platform: '' };
}

function isIOS() {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ─── Browser icons ────────────────────────────────────────────────────────────

const ChromeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#fff" />
    <circle cx="12" cy="12" r="4.2" fill="#4285F4" />
    <path d="M12 7.8h8.6A10 10 0 0 0 3.6 6.3L8 14a4.2 4.2 0 0 1 4-6.2z" fill="#EA4335" />
    <path d="M12 16.2a4.2 4.2 0 0 1-3.6-2L4 6.3a10 10 0 0 0 3.4 16.3L12 16.2z" fill="#34A853" />
    <path d="M20.6 7.8H12a4.2 4.2 0 0 1 3.6 6.2l4.4 7.7A10 10 0 0 0 20.6 7.8z" fill="#FBBC05" />
  </svg>
);

const BraveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#FB542B" />
    <path d="M19.2 7.4l-.9-1.1H5.7l-.9 1.1-.7 3.8.4.4-.4.5.6.7-.3.5.9.9.2.5c.8 1.8 2.8 3.3 5.5 4 2.7-.7 4.7-2.2 5.5-4l.2-.5.9-.9-.3-.5.6-.7-.4-.5.4-.4-.7-3.8z" fill="white" />
    <path d="M12 17.5c-2.1-.6-3.7-1.8-4.4-3.2l-.1-.4-.7-.7.2-.4-.5-.6.3-.4-.3-1.8.6-.7h9.8l.6.7-.3 1.8.3.4-.5.6.2.4-.7.7-.1.4c-.7 1.4-2.3 2.6-4.4 3.2z" fill="#FB542B" />
  </svg>
);

const FirefoxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#FF9400" />
    <path d="M18.5 8.5c-.5-1-1.3-2-2.4-2.5 0 0 .8 1.2.5 2.2-.4-.5-1.2-1-2-1 0 0 .8.8.7 2-.3-.3-.9-.5-1.3-.5 0 0 .4.5.3 1.3-.7-.2-1.7 0-2.3.8-.3.4-.5 1-.4 1.6.1.5.3 1 .6 1.4.6.7 1.5 1.2 2.5 1.2 2.2 0 4-1.8 4-4 0-.9-.3-1.8-.2-2.5z" fill="#FF3750" />
  </svg>
);

const SamsungIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#1428A0" />
    <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">S</text>
  </svg>
);

const SafariIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <defs>
      <linearGradient id="saf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#18BFFF" />
        <stop offset="100%" stopColor="#0070FF" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#saf)" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" />
    <path d="M12 5v2M12 17v2M5 12H3M21 12h-2" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <polygon points="14.5,9.5 9.5,14.5 12,12" fill="white" />
    <polygon points="9.5,9.5 14.5,14.5 12,12" fill="rgba(255,255,255,0.45)" />
  </svg>
);

const DefaultIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// ─── Browser list ─────────────────────────────────────────────────────────────

interface Browser {
  id: string;
  name: string;
  icon: React.ReactNode;
  getUrl: (target: string) => string;
}

const BROWSERS_ANDROID: Browser[] = [
  {
    id: 'chrome',
    name: 'Chrome',
    icon: <ChromeIcon />,
    getUrl: (t) =>
      `intent://${t.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;end`,
  },
  {
    id: 'brave',
    name: 'Brave',
    icon: <BraveIcon />,
    getUrl: (t) =>
      `intent://${t.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.brave.browser;action=android.intent.action.VIEW;end`,
  },
  {
    id: 'firefox',
    name: 'Firefox',
    icon: <FirefoxIcon />,
    getUrl: (t) =>
      `intent://${t.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.mozilla.firefox;action=android.intent.action.VIEW;end`,
  },
  {
    id: 'samsung',
    name: 'Samsung',
    icon: <SamsungIcon />,
    getUrl: (t) =>
      `intent://${t.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.sec.android.app.sbrowser;action=android.intent.action.VIEW;end`,
  },
  {
    id: 'default',
    name: 'Default',
    icon: <DefaultIcon />,
    getUrl: (t) =>
      `intent://${t.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`,
  },
];

const BROWSERS_IOS: Browser[] = [
  {
    id: 'chrome',
    name: 'Chrome',
    icon: <ChromeIcon />,
    getUrl: (t) => `googlechrome://${t.replace(/^https?:\/\//, '')}`,
  },
  {
    id: 'brave',
    name: 'Brave',
    icon: <BraveIcon />,
    getUrl: (t) => `brave://${t}`,
  },
  {
    id: 'firefox',
    name: 'Firefox',
    icon: <FirefoxIcon />,
    getUrl: (t) => `firefox://open-url?url=${encodeURIComponent(t)}`,
  },
  {
    id: 'safari',
    name: 'Safari',
    icon: <SafariIcon />,
    getUrl: (t) => t,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function InAppBrowserNotice() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const { isInApp, platform } = detectInAppBrowser();
    if (isInApp) {
      setVisible(true);
      setPlatform(platform);
      setUrl(window.location.href);
    }
  }, []);

  if (!visible) return null;

  const browsers = isIOS() ? BROWSERS_IOS : BROWSERS_ANDROID;
  const target = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'about:blank';
    }
  };

  const handleBrowserSelect = (browser: Browser) => {
    window.location.href = browser.getUrl(target);
    // If the specific browser isn't installed, fall back to system default after 1.5 s
    if (browser.id !== 'default' && browser.id !== 'safari') {
      setTimeout(() => {
        const fallback = isIOS()
          ? target
          : `intent://${target.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
        window.location.href = fallback;
      }, 1500);
    }
    setShowPicker(false);
  };

  return (
    <>
      {/* Backdrop */}
      {showPicker && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPicker(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-5 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm mx-auto bg-[#0f1f1f] rounded-2xl shadow-2xl shadow-black/60 border border-white/10 overflow-hidden">

          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#27ae60] to-[#1abc9c]" />

          <div className="px-4 pt-4 pb-4">

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <p className="text-white font-black text-sm">Inaccurate Location Detected</p>
            </div>

            {/* Body */}
            <p className="text-white/55 text-xs leading-relaxed mb-4">
              You're inside <span className="text-white/80 font-semibold">{platform}</span>'s
              browser. GPS is limited here — open in Chrome, Brave, or any browser below
              for precise location.
            </p>

            {/* Browser picker */}
            {showPicker && (
              <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">
                  Choose a browser
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {browsers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleBrowserSelect(b)}
                      className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        {b.icon}
                      </span>
                      <span className="text-white/65 text-[9px] font-bold">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Two buttons */}
            <div className="flex gap-2">

              {/* ← Go back in [Platform] */}
              <button
                onClick={handleGoBack}
                className="flex-1 bg-white/8 hover:bg-white/15 active:scale-95 text-white/65 font-bold text-[11px] py-3 px-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 border border-white/10"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="truncate">Back in {platform}</span>
              </button>

              {/* Go Now ↑ (toggles picker) */}
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="flex-1 bg-[#27ae60] hover:bg-[#219a54] active:scale-95 text-white font-black text-[11px] py-3 px-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-green-900/40"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Go Now
                <svg
                  className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
