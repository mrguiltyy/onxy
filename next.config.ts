import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow remote images from common avatar / banner CDNs and any HTTPS host
  // (we use plain <img> tags in the onboarding picker, but this future-proofs
  // anywhere we switch to next/image).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
