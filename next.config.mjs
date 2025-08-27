/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Only ignore during development if needed
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
