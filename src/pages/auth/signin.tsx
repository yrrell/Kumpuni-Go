// src/pages/auth/signin.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /FBAN|FBAV|FB_IAB|FB4A|FBIOS/.test(ua) ||   // Facebook / FB Lite
    /Instagram/.test(ua) ||                        // Instagram
    /Twitter/.test(ua) ||                          // Twitter
    /Line\//.test(ua) ||                           // LINE
    /\bwv\b/.test(ua) ||                           // Generic Android WebView flag
    /WebView/.test(ua) ||
    (/Android/.test(ua) && /Version\/\d/.test(ua) && !/Chrome/.test(ua))
  );
}

export default function SignIn() {
  const router = useRouter();
  const redirect = (router.query.redirect as string) || '/contribute/add';
  const [inWebView, setInWebView] = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    setInWebView(isWebView());
  }, []);

  const handleLogin = async () => {
    if (isWebView()) return; // safety guard
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirect}`,
      },
    });
  };

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback – select a textarea
      const ta = document.createElement('textarea');
      ta.value = pageUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ── WebView blocked screen ──
  if (inWebView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <img
          src="/assets/kumpuni-go-logo.png"
          alt="Kumpuni Go"
          className="w-16 h-16 rounded-full object-cover mb-5"
        />

        <div className="text-5xl mb-4">🚫</div>

        <h1 className="text-[#1a3a3a] font-black text-lg uppercase italic mb-2">
          Open in Chrome or Safari
        </h1>
        <p className="text-gray-500 text-[12px] font-bold max-w-xs leading-relaxed mb-6">
          Google Sign-In is blocked inside <span className="text-[#1a3a3a]">Facebook, Messenger,
          Instagram</span> and other in-app browsers.
          <br /><br />
          Copy the link below and paste it in <span className="text-[#1a3a3a]">Chrome</span> or your
          phone&apos;s default browser to sign in.
        </p>

        {/* URL box */}
        <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-3 break-all text-[11px] font-bold text-gray-500 text-left">
          {pageUrl}
        </div>

        <button
          onClick={handleCopy}
          className={`w-full max-w-sm py-4 rounded-2xl font-black uppercase text-sm shadow-md transition-all active:scale-95 ${
            copied
              ? 'bg-[#27ae60] text-white shadow-green-200'
              : 'bg-[#1a3a3a] text-white shadow-gray-200'
          }`}
        >
          {copied ? '✅ Link Copied!' : '📋 Copy Link'}
        </button>

        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 w-full max-w-sm text-left">
          <p className="text-amber-700 font-black text-[11px] uppercase tracking-wide mb-2">
            How to open in Chrome
          </p>
          <ol className="text-amber-600 text-[11px] font-bold space-y-1 list-decimal list-inside">
            <li>Tap <strong>Copy Link</strong> above</li>
            <li>Open <strong>Chrome</strong> (or Safari on iPhone)</li>
            <li>Paste the link in the address bar</li>
            <li>Sign in with Google normally ✅</li>
          </ol>
        </div>
      </div>
    );
  }

  // ── Normal sign-in screen ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <img
        src="/assets/kumpuni-go-logo.png"
        alt="Kumpuni Go"
        className="w-20 h-20 rounded-full object-cover mb-6"
      />
      <h1 className="text-xl font-black text-[#1a3a3a] mb-1 uppercase italic">Kumpuni Go!</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6 w-full max-w-sm">
        <p className="text-amber-700 font-black text-[11px] uppercase tracking-wide">
          🔒 Anti-Scam Verification
        </p>
        <p className="text-amber-600 text-[10px] font-bold mt-1">
          Gmail sign-in is required to ensure all contributions are real and traceable.
        </p>
      </div>

      <h2 className="text-lg font-black text-[#1a3a3a] mb-2 uppercase italic">Sign in to Continue</h2>
      <p className="text-gray-400 text-[11px] font-bold mb-8 uppercase">
        Secure • Free • Required for contribution
      </p>

      <button
        onClick={handleLogin}
        className="w-full max-w-sm bg-[#1a3a3a] text-white p-5 rounded-2xl font-black uppercase text-sm shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.2 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.1-10 6.1-17z"/>
          <path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.7 2.2-7.7 2.2-6.2 0-11.5-3.8-13.4-9.2l-7.9 6C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      <button
        onClick={() => router.back()}
        className="mt-4 text-gray-400 text-[11px] font-bold underline"
      >
        Cancel
      </button>
    </div>
  );
}
