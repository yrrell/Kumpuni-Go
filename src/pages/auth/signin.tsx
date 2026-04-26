import React from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function SignIn() {
  const router = useRouter();
  const redirect = (router.query.redirect as string) || '/contribute/add';

  const handleLogin = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authRedirect', redirect);
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
