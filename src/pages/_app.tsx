// src/pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { LocationProvider } from '../context/LocationContext';
import { InAppBrowserNotice } from '../components/ui/InAppBrowserNotice';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LocationProvider>
      <Head>
        <title>Kumpuni Go!</title>
        <meta name="description" content="Find nearby vulcanizing and motor shops." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/kumpuni-go-logo.png" />
      </Head>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-[#1a3a3a] dark:text-white transition-colors duration-300">
        <Component {...pageProps} />
      </div>
    </LocationProvider>
  );
}
