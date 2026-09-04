/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite'],
  },
  outputFileTracingIncludes: {
    '/**': ['./schema/**/*'],
  },
};

module.exports = nextConfig;

