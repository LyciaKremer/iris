import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Upload do export de clipping (JSON) passa por uma Server Action.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
