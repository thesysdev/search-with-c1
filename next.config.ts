import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    THESYS_API_KEY: process.env.THESYS_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CX_KEY: process.env.GOOGLE_CX_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

export default nextConfig;
