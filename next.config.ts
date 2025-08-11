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
  // Enable compression for better performance
  compress: true,
  // Ensure server-side modules are not bundled for client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        'readable-stream': false,
      };
      
      // Exclude Winston and related packages from client bundles
      config.externals = config.externals || [];
      config.externals.push({
        winston: 'winston',
        'winston-transport': 'winston-transport',
        'readable-stream': 'readable-stream',
      });
    }
    return config;
  },
  // Updated: Use serverExternalPackages instead of deprecated experimental option
  serverExternalPackages: ['bcryptjs', 'winston', 'winston-transport'],
};

export default nextConfig;
