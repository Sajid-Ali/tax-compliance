import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next's default Server Action body limit is 1MB — too small for the
      // avatar upload (app/profile/actions.ts validates up to 5MB), so
      // anything over 1MB was hitting this platform-level 413 before ever
      // reaching that validation. Small headroom above 5MB for multipart
      // form overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
