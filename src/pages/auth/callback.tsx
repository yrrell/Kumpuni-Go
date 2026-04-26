import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const destination = localStorage.getItem('authRedirect') || '/contribute/add';
    localStorage.removeItem('authRedirect');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe();
        router.replace(destination);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(destination);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#1a3a3a] font-black uppercase text-sm animate-pulse">Signing in...</p>
    </div>
  );
}
