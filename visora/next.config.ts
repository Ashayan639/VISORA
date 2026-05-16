import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
