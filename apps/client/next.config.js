/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for full-stack app
  // output: 'export',
  trailingSlash: true,
  // distDir: 'out',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/',
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  }
};

module.exports = nextConfig;
