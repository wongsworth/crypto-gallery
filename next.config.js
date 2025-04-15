/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: ''
};

module.exports = nextConfig; 