import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const destination = localStorage.getItem('authRedirect') || '/contribute/add';
    localStorage.removeItem('authRedirect');

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        window.location.href = destination;
      });
    } else {
      window.location.href = '/auth/signin';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#1a3a3a] font-black uppercase text-sm animate-pulse">Signing in...</p>
    </div>
  );
}
