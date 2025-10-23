/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // catch potential React issues
  swcMinify: true, // faster builds with SWC

  // ✅ Webpack fixes for browser & Vercel build compatibility
  webpack: (config, { isServer }) => {
    // Ignore Node 'fs' in the browser
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }

    // Prevent Next/Vercel from bundling Node-specific TFJS modules
    if (isServer) {
      config.externals.push({
        "@vladmandic/human": "commonjs @vladmandic/human",
        "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node",
      });
    }

    return config;
  },

  // ✅ Content Security Policy optimized for local models
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

  // ✅ Allow optimized images from Supabase and Vercel only
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
    ],
  },

  // ✅ Include /public/models/ in build output for Human.js
  experimental: {
    outputFileTracingIncludes: {
      "/": ["./public/models/**"], // ensures Human models are deployed with Vercel
    },
  },

  // ✅ Generate source maps for debugging in production
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
