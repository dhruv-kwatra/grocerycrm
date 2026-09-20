import type { NextConfig } from "next";

// Standalone Retail CRM frontend. Talks to the SAME NestJS backend as the core
// portal — only the retail prefix is proxied here (this app has no other
// modules). Override the backend origin with API_PROXY_TARGET.
const API_TARGET = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4400";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
    staleTimes: { dynamic: 180, static: 300 },
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Only the retail module + backend-owned object storage. Everything else
        // (core/crm/hrms/…) is intentionally absent — this app is retail-only.
        { source: "/api/retail/:path*", destination: `${API_TARGET}/api/retail/:path*` },
        { source: "/api/uploads/serve", destination: `${API_TARGET}/api/uploads/serve` },
        { source: "/api/uploads/avatar", destination: `${API_TARGET}/api/uploads/avatar` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
