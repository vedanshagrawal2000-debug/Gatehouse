import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@gatehouse/shared', '@gatehouse/tools', '@gatehouse/agents'],
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async rewrites() {
    const rawApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const apiUrl = rawApiUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
