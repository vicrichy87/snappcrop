// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Helps catch potential issues in React
  swcMinify: true, // Uses SWC for faster builds

  // ✅ Fix: ignore Node 'fs' module in browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
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
            `.replace(/\s{2,}/g, " "), // clean formatting
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

  // ✅ Optimize Next.js image domains
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // for user-uploaded images
      },
      {
        protocol: "https",
        hostname: "**.vercel.app", // for your hosted demo images
      },
    ],
  },

  // ✅ Enable source maps in production for debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
