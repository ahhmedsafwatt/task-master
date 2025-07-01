import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enhanced image optimization
  images: {
    remotePatterns: [
      {
        hostname: 'gmlyqpnzcebtzxvgtwmc.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Split chunks for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          motion: {
            test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
            name: 'motion',
            priority: 20,
            chunks: 'all',
          },
          three: {
            test: /[\\/]node_modules[\\/](@react-three|three)[\\/]/,
            name: 'three',
            priority: 20,
            chunks: 'all',
          },
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 20,
            chunks: 'all',
          },
        },
      }
    }

    // Optimize imports
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Tree shake unused code
        'framer-motion': 'motion/react',
      }
    }

    return config
  },

  // Production optimization
  productionBrowserSourceMaps: false,
  
  // Reduce bundle size
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'react-icons',
    ],
  },

  // Enable compression
  compress: true,

  // Logging only in development
  logging: process.env.NODE_ENV === 'development' ? {
    fetches: {
      fullUrl: true,
    },
  } : undefined,
}

export default nextConfig
