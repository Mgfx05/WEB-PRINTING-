import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for catching potential issues
  reactStrictMode: true,

  // Transpile internal workspace packages
  transpilePackages: ["@erb/types", "@erb/validation", "@erb/database"],

  // Server actions config
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb", // For PDF uploads via server actions (primary upload is via API route)
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      // Add production image CDN domains here
    ],
  },

  // Packages that should only run on Node.js server (not bundled for edge/browser)
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcryptjs",
    "bullmq",
    "ioredis",
    "sharp",
    "winston",
  ],

  // Webpack config for pdf.js worker and BullMQ optional deps
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    if (isServer) {
      // Suppress optional BullMQ valkey-glide dep that's not installed
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request === '@valkey/valkey-glide') {
            return callback(null, 'commonjs @valkey/valkey-glide');
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
