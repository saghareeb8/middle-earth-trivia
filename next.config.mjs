import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable the service worker in dev to avoid caching headaches while iterating.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Full server runtime (no static export) — leaves room for API routes /
  // server-side multiplayer later. Deploys zero-config on Vercel; Netlify uses
  // @netlify/plugin-nextjs automatically.
};

export default withPWA(nextConfig);
