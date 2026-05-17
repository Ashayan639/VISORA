import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: app lives in visora/; dependencies install here on Vercel.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      // Google account profile pictures (NextAuth Google provider).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Common image CDNs we'll likely surface from generated content.
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // @react-three/drei pulls VideoTexture → hls.js; webpack needs an explicit
      // resolution so production builds succeed on all platforms.
      "hls.js": path.join(process.cwd(), "node_modules", "hls.js"),
    };
    return config;
  },
};

export default nextConfig;
