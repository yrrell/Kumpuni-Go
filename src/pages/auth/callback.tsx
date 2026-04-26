// src/pages/auth/callback.tsx
// FIXED: supabase-js v2 uses PKCE by default.
// After Google OAuth, Supabase sends ?code= in the QUERY STRING, NOT the #hash.
// Old code read window.location.hash → always empty → always redirected to /auth/signin.
// Fix: read window.location.search and call exchangeCodeForSession(code).

import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      // Retrieve the destination saved before sign-in was triggered
      const destination =
        localStorage.getItem('authRedirect') || '/contribute/add';
      localStorage.removeItem('authRedirect');

      // ✅ PKCE flow: Supabase returns ?code= in the query string (NOT the hash)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        // Exchange the one-time code for a real session stored in localStorage
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.location.href = destination; // ✅ Goes to /contribute/add
          return;
        }
        console.error('PKCE exchange error:', error.message);
      }

      // Fallback: check if a session already exists (edge cases / re-visits)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        window.location.href = destination;
      } else {
        // Something went wrong — send user back to sign-in
        window.location.href = '/auth/signin?redirect=' + encodeURIComponent(destination);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#1a3a3a] font-black uppercase text-sm animate-pulse">
        Signing in…
      </p>
    </div>
  );
}

