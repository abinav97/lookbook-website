import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages stay statically prerendered; the only server code is /api/advise,
  // which is why `output: "export"` was removed in Phase 3.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
