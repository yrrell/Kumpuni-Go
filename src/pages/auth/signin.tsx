// src/pages/auth/signin.tsx
import React from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function SignIn() {
  const router = useRouter();
  const redirect = (router.query.redirect as string) || '/contribute/add';

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirect}`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      <img src="/assets/kumpuni-go-logo.png" alt="Kumpuni Go" className="w-20 h-20 rounded-full object-cover mb-6" />
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
