import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// CDN Configuration
// const CDN_URL = process.env.CDN_URL || process.env.NEXT_PUBLIC_CDN_URL;
// const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // CDN asset prefix for production
  // assetPrefix: isProd && CDN_URL ? CDN_URL : undefined,
  async headers() {
    return await [
      // {
      //   source: '/(.*)',
      //   headers: [
      //     {
      //       key: 'X-Content-Type-Options',
      //       value: 'nosniff',
      //     },
      //     {
      //       key: 'X-Frame-Options',
      //       value: 'DENY',
      //     },
      //     {
      //       key: 'Referrer-Policy',
      //       value: 'strict-origin-when-cross-origin',
      //     },
      //   ],
      // },
      // CDN-optimized static assets
      // {
      //   source: '/static/(.*)',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       value: 'public, max-age=31536000, immutable',
      //     },
      //     {
      //       key: 'CDN-Cache-Control',
      //       value: 'public, max-age=31536000',
      //     },
      //   ],
      // },
      // Images and media files
      // {
      //   source: '/(.*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|mp4|webm))',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       value: 'public, max-age=31536000, immutable',
      //     },
      //     {
      //       key: 'Vary',
      //       value: 'Accept, Accept-Encoding',
      //     },
      //   ],
      // },
      // Fonts
      // {
      //   source: '/(.*\\.(woff|woff2|eot|ttf|otf))',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       value: 'public, max-age=31536000, immutable',
      //     },
      //     {
      //       key: 'Access-Control-Allow-Origin',
      //       value: '*',
      //     },
      //   ],
      // },
      // {
      //   source: '/sw.js',
      //   headers: [
      //     {
      //       key: 'Content-Type',
      //       value: 'application/javascript; charset=utf-8',
      //     },
      //     {
      //       key: 'Cache-Control',
      //       value: 'no-cache, no-store, must-revalidate',
      //     },
      //     {
      //       key: 'Content-Security-Policy',
      //       value: "default-src 'self'; script-src 'self'",
      //     },
      //   ],
      // },
    ];
  },
  transpilePackages: ["@kaa/ui"],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "g4xflqho64cmocrw.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "imgz.app",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "ssl.cdn-redfin.com",
      },
      {
        protocol: "https",
        hostname: "kaa-images.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },

      // Add CDN domains
      // ...(CDN_URL ? [{
      //   protocol: "https" as const,
      //   hostname: new URL(CDN_URL).hostname,
      // }] : []),
    ],
    // Enable optimization for CDN
    unoptimized: false,
    // formats: ["image/avif", "image/webp"],
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Custom loader for CDN optimization
    // loader: CDN_URL ? 'custom' : 'default',
    // loaderFile: CDN_URL ? './lib/cdn-image-loader.ts' : undefined,
    // Image optimization settings
    // minimumCacheTTL: 31536000, // 1 year
    // dangerouslyAllowSVG: true,
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Environment variables now go into .env files or use the runtime config
  // https://nextjs.org/docs/app/api-reference/next-config-js/runtime-configuration
  publicRuntimeConfig: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    // MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    // STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  experimental: {},
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "optiflow-softwares",

  project: "kaa",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
