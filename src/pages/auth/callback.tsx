import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const destination = localStorage.getItem('authRedirect') || '/contribute/add';
    localStorage.removeItem('authRedirect');

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        clearInterval(interval);
        router.replace(destination);
      } else if (attempts > 10) {
        clearInterval(interval);
        router.replace('/auth/signin');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#1a3a3a] font-black uppercase text-sm animate-pulse">Signing in...</p>
    </div>
  );
}
