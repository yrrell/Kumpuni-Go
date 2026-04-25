// src/pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { LocationProvider } from '../context/LocationContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LocationProvider>
      <Head>
        <title>Kumpuni Go!</title>
        <meta name="description" content="Find nearby vulcanizing and motor shops." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/assets/kumpuni-go-logo.png" />
      </Head>
      <Component {...pageProps} />
    </LocationProvider>
  );
}
