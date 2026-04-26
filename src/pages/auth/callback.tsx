import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/contribute/add');
      } else {
        router.replace('/auth/signin');
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#1a3a3a] font-black uppercase text-sm animate-pulse">Signing in...</p>
    </div>
  );
}
