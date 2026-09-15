import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', 'three-globe', 'react-globe.gl'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
