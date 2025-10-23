// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Helps catch potential issues in React
  swcMinify: true, // Uses SWC for faster builds

  // ✅ Webpack fixes for browser compatibility and Human.js build issues
  webpack: (config, { isServer }) => {
    // ✅ Ignore Node 'fs' module in browser
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }

    // ✅ Prevent Vercel build from including Human.js Node backend
    if (isServer) {
      config.externals.push({
        "@vladmandic/human": "commonjs @vladmandic/human",
        "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node",
      });
    }

    return config;
  },

  // ✅ Fix: CSP & MIME-type handling
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:;
              connect-src 'self' https://*.vercel.app https://api.vercel.com https://*.supabase.co;
              img-src 'self' blob: data: https:;
              style-src 'self' 'unsafe-inline';
              font-src 'self' data:;
            `.replace(/\s{2,}/g, " "), // Clean up whitespace
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ✅ Optimize Next.js image handling for Supabase + Vercel
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // for user-uploaded images
      },
      {
        protocol: "https",
        hostname: "**.vercel.app", // for demo/preview images
      },
    ],
  },

  // ✅ Enable source maps in production for debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
