import type { NextConfig } from "next";
import { BASE_PATH } from "./src/libs/base-path";

const nextConfig: NextConfig = {
  // Served at <domain>/travel/quote, alongside the sales app.
  basePath: BASE_PATH,
  async redirects() {
    // Visiting the bare domain while developing locally. In production the
    // web server shows the landing page at "/" instead, so this isn't reached.
    return [{ source: "/", destination: BASE_PATH, basePath: false, permanent: false }];
  },
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Room for a banner image upload (5MB max, checked in the action).
      bodySizeLimit: "6mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
