/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable error checking in production builds
  eslint: {
    // Only ignore during development if needed
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Only ignore during development if needed
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

export default nextConfig
