/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Only ignore during development if needed
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Enable server components optimizations
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle Node.js built-in modules
    const nodeModules = [
      'child_process', 'fs', 'fs/promises', 'net', 'tls', 'module', 
      'process', 'path', 'os', 'crypto', 'util', 'stream', 'buffer', 
      'events', 'url', 'http', 'https', 'assert', 'zlib', 'querystring'
    ];

    if (!isServer) {
      // Client-side fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ...nodeModules.reduce((acc, mod) => {
          acc[mod] = false;
          return acc;
        }, {})
      };
    }

    // Configure externals for both node: prefixed and regular modules
    const externals = {};
    nodeModules.forEach(mod => {
      externals[`node:${mod}`] = `commonjs ${mod}`;
      if (isServer) {
        externals[mod] = `commonjs ${mod}`;
      }
    });

    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push(externals);
    }

    // Add webpack plugin to handle node: scheme
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/, 
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );

    // Additional alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      ...nodeModules.reduce((acc, mod) => {
        if (!isServer) {
          acc[mod] = false;
        }
        return acc;
      }, {})
    };

    return config;
  },
}

export default nextConfig
