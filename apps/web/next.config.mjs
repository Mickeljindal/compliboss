/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the marketing site can run in a minimal Docker image.
  output: 'standalone',
};

export default nextConfig;
