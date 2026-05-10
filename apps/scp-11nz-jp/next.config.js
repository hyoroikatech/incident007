const path = require("path");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === "export" ? "export" : undefined,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@incident007/escape-engine"],
  experimental: {
    optimizePackageImports: ["pixi.js"],
  },
  webpack: (config) => {
    config.resolve.alias["@incident007/escape-engine"] = path.resolve(
      __dirname,
      "../../packages/escape-engine/src",
    );
    return config;
  },
};

module.exports = nextConfig;
