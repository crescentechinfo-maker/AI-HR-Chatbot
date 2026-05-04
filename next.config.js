/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Alias avoids pdf-parse auto-loading its own test fixtures at build time
      config.resolve.alias['pdf-parse'] = 'pdf-parse/lib/pdf-parse.js';
    }
    return config;
  },
};

module.exports = nextConfig;
