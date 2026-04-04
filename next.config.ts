import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/moodle-brand-logo",
      },
    ],
  },
};

export default nextConfig;
