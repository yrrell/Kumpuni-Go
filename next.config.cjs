// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  toolbar: {
    enabled: false,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile pictures
      '*.supabase.co',             // Supabase storage
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
