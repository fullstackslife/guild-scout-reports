/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yzmuyiuxfthptezgxpgo.supabase.co',
        pathname: '/storage/v1/object/**'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    // Exclude oracledb from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        oracledb: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
