import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Handle different ports for development and production
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || 'http://10.116.2.72:8090'
      : 'http://localhost:3000',
  },
};

export default nextConfig;
