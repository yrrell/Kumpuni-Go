import React from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <Image src="/assets/kumpuni-go-logo.png" alt="Logo" width={80} height={80} className="mb-4" />
      <h1 className="text-2xl font-black uppercase text-[#1a3a3a] mb-2">Kumpuni Go!</h1>
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 text-center">
        <p className="text-orange-600 font-bold text-sm uppercase">🔒 Anti-Scam Verification</p>
        <p className="text-orange-500 text-sm mt-1">Gmail sign-in is required to ensure all contributions are real and traceable.</p>
      </div>
      <p className="font-black uppercase text-[#1a3a3a] text-lg mb-1">Sign In to Continue</p>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-6">Secure • Free • Required for Contribution</p>
      <button onClick={handleLogin} className="w-full bg-[#1a3a3a] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-wider">
        <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} unoptimized />
        Continue with Google
      </button>
      <button onClick={() => router.back()} className="mt-4 text-gray-400 text-sm underline">Cancel</button>
    </div>
  );
}
