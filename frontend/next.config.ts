import type { NextConfig } from "next";

/** Static export under `out/` is used by the Cloudflare Worker (`wrangler deploy`). */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
