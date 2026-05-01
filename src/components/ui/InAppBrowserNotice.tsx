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

// ─── Component ────────────────────────────────────────────────────────────────

export function InAppBrowserNotice() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const { isInApp, platform } = detectInAppBrowser();
    if (isInApp) {
      setVisible(true);
      setPlatform(platform);
      setUrl(window.location.href);
    }
  }, []);

  if (!visible) return null;

  const target = url || (typeof window !== 'undefined' ? window.location.href : '');

  // ── Go back to the platform app ──────────────────────────────────────────
  // window.close() tells the WebView to close itself and return to the host
  // app (Facebook, Messenger, Instagram, etc.). Falls back to history.back()
  // on the rare case the WebView doesn't honour close().
  const handleGoBack = () => {
    try {
      window.close();
      // If close() is ignored (some WebViews block it), fall back after 300 ms
      setTimeout(() => {
        if (!document.hidden) window.history.back();
      }, 300);
    } catch {
      window.history.back();
    }
  };

  // ── Open in the user's real browser ─────────────────────────────────────
  // window.open with _blank triggers the platform's native "You're leaving
  // our app → Continue" dialog. Tapping Continue opens the URL in whatever
  // browser the user has set as default — no guessing of installed apps needed.
  const handleGoNow = () => {
    const a = document.createElement('a');
    a.href = target;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
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
            You're inside{' '}
            <span className="text-white/80 font-semibold">{platform}</span>'s browser.
            GPS is limited here — tap{' '}
            <span className="text-[#27ae60] font-semibold">Go Now</span> to open in
            your device's browser for precise location.
          </p>

          {/* Buttons */}
          <div className="flex gap-2">

            {/* ← Back in [Platform] — closes the WebView, returns to app */}
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

            {/* Go Now — opens via _blank, platform shows "leave app" → opens default browser */}
            <button
              onClick={handleGoNow}
              className="flex-1 bg-[#27ae60] hover:bg-[#219a54] active:scale-95 text-white font-black text-[11px] py-3 px-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-green-900/40"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Go Now
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
