/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite'],
  },
    '/**': ['./schema/**/*'],
  },
};

module.exports = nextConfig;

