import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', 'three-globe', 'react-globe.gl'],
};

export default nextConfig;
