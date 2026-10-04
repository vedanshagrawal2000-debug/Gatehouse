import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@gatehouse/shared', '@gatehouse/tools', '@gatehouse/agents'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
