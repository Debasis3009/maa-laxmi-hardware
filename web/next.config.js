/** @type {import('next').NextConfig} */
const nextConfig = {
  // node:sqlite (used by the dev/demo DB adapter) is a server-only built-in.
  // Keep it out of the client bundle and out of Next's server bundling step.
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite'],
  },
};

module.exports = nextConfig;
