// src/components/ui/InAppBrowserNotice.tsx
import React, { useEffect, useState } from 'react';

/** Returns 'ios' or 'android' based on the user-agent. */
function detectPlatform(): 'ios' | 'android' {
  if (typeof window === 'undefined') return 'android';
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) ? 'ios' : 'android';
}

/**
 * Detects which in-app browser the user is inside.
 * Returns the platform name string, or null if NOT inside an in-app browser.
 *
 * Order matters — more-specific tokens are checked first so that Instagram
 * (which also carries FB tokens) is labelled "Instagram", not "Facebook".
 */
function detectInAppBrowserPlatform(): string | null {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent || '';

  // Meta family
  if (/Instagram/i.test(ua))                            return 'Instagram';
  if (/Messenger/i.test(ua))                            return 'Messenger';
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS|\[FB\]/i.test(ua)) return 'Facebook';

  // Other major apps
  if (/TikTok/i.test(ua))                              return 'TikTok';
  if (/Twitter|XCorp/i.test(ua))                       return 'X (Twitter)';
  if (/Snapchat/i.test(ua))                            return 'Snapchat';
  if (/Pinterest/i.test(ua))                           return 'Pinterest';
  if (/LinkedIn/i.test(ua))                            return 'LinkedIn';
  if (/Line\//i.test(ua))                              return 'LINE';
  if (/MicroMessenger|WeChat/i.test(ua))               return 'WeChat';
  if (/Telegram/i.test(ua))                            return 'Telegram';
  if (/WhatsApp/i.test(ua))                            return 'WhatsApp';
  if (/Reddit/i.test(ua))                              return 'Reddit';
  if (/Discord/i.test(ua))                             return 'Discord';

  return null;
}

/**
 * Returns the deep-link URI to re-open the native app so we have a
 * fallback if window.close() is silently blocked by the WebView.
 */
function getNativeAppScheme(platformName: string): string | null {
  switch (platformName) {
    case 'Instagram':   return 'instagram://';
    case 'Messenger':   return 'fb-messenger://';
    case 'Facebook':    return 'fb://';
    case 'TikTok':      return 'snssdk1233://';
    case 'X (Twitter)': return 'twitter://';
    case 'Snapchat':    return 'snapchat://';
    case 'Pinterest':   return 'pinterest://';
    case 'LinkedIn':    return 'linkedin://';
    case 'LINE':        return 'line://';
    case 'WeChat':      return 'weixin://';
    case 'WhatsApp':    return 'whatsapp://';
    default:            return null;
  }
}

export const InAppBrowserNotice = () => {
  const [platform, setPlatform] = useState<string | null>(null);
  const [chromeHref, setChromeHref]   = useState('#');
  const [defaultHref, setDefaultHref] = useState('#');

  useEffect(() => {
    const detected = detectInAppBrowserPlatform();
    if (!detected) return;
    setPlatform(detected);

    const url    = window.location.href;
    const host   = window.location.host;
    const path   = window.location.pathname + window.location.search + window.location.hash;
    const device = detectPlatform();

    if (device === 'ios') {
      setChromeHref(`googlechromes://${host}${path}`);
      setDefaultHref(url);
    } else {
      const base = `intent://${host}${path}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(url)}`;
      setChromeHref(`${base};package=com.android.chrome;end`);
      setDefaultHref(`${base};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`);
    }
  }, []);

  if (!platform) return null;

  /**
   * EXIT the in-app browser and return the user to the native app.
   *
   * Strategy (in order):
   *  1. window.close()  — closes the WebView tab in Instagram, Messenger, etc.
   *  2. Deep-link URI   — re-launches the native app as a fallback (300 ms delay
   *                       gives the close time to fire first).
   *  3. about:blank     — last resort so the user is not stuck on LoadingScreen.
   */
  const handleGoBack = () => {
    // 1. Try to close the WebView entirely
    window.close();

    // 2. If still here after 300 ms, redirect to the native app via deep link
    setTimeout(() => {
      if (document.hidden) return; // window.close() already worked

      const scheme = getNativeAppScheme(platform);
      if (scheme) {
        window.location.href = scheme;
        return;
      }

      // 3. Generic last resort — blank the page so it is not stuck on loading
      window.location.href = 'about:blank';
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      {/* Dim backdrop — tapping it triggers the same exit */}
      <div className="absolute inset-0 bg-black/60" onClick={handleGoBack} />

      {/* Bottom sheet */}
      <div className="relative bg-[#1a2e2e] rounded-t-3xl p-6 shadow-2xl border-t border-white/10">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 text-lg">📍</span>
          </div>
          <div>
            <p className="text-white font-black text-sm mb-1">Inaccurate Location Detected</p>
            <p className="text-white/60 text-xs font-bold leading-relaxed">
              You&apos;re inside{' '}
              <span className="text-white font-black">{platform}</span>
              &apos;s browser. GPS is limited here — open in Chrome or your
              default browser for precise location.
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
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/chrome.png"
                  alt="Chrome"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-white text-[11px] font-black">Chrome</span>
            </a>

            {/* Default Browser */}
            <a
              href={defaultHref}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span className="text-white text-[11px] font-black">Default</span>
            </a>

          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex gap-3">

          {/* Back in [Platform] — exits the WebView and returns to the native app */}
          <button
            onClick={handleGoBack}
            className="flex-1 py-3 rounded-2xl border border-white/20 text-white/60 font-black text-sm"
          >
            ‹ Back in {platform}
          </button>

          {/* Go Now — opens in default external browser */}
          <a
            href={defaultHref}
            className="flex-1 py-3 rounded-2xl bg-[#27ae60] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
