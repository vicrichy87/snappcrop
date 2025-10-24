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

    // Prevent Next/Vercel from bundling Node-specific TFJS or Human.js modules
    if (isServer) {
      config.externals.push({
        "@vladmandic/human": "commonjs @vladmandic/human",
        "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node",
      });
    }

    // ✅ Allow importing local ESM bundles (e.g., /public/libs/human.esm.js)
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false, // prevents ESM resolution issues
      },
    });

    return config;
  },

  // ✅ Content Security Policy optimized for local libs/models
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
              connect-src 'self' blob: data:
                https://*.vercel.app
                https://api.vercel.com
                https://*.supabase.co
                https://cdn.jsdelivr.net
                /libs/
                /models/; 
              img-src 'self' blob: data: https:;
              style-src 'self' 'unsafe-inline';
              font-src 'self' data:;
            `.replace(/\s{2,}/g, " ").trim(),
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

  // ✅ Ensure /public/models/ and /public/libs/ are included in Vercel deployment
  experimental: {
    outputFileTracingIncludes: {
      "/": ["./public/models/**", "./public/libs/**"],
    },
  },

  // ✅ Generate source maps for debugging in production
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
