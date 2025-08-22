/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adding a comment to trigger a server restart and clear cache
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
