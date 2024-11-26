// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         "fs": false,
//         "net": false,
//         "tls": false,
//         "crypto": false,
//         "path": false,
//         "os": false,
//         "stream": false,
//         "buffer": false,
//         "@azure/app-configuration": false
//       };
//     }
//     return config;
//   },
//   experimental: {
//     serverComponentsExternalPackages: ['oracledb']
//   },
//   env: {
//     ORACLE_CLIENT_PATH: process.env.ORACLE_CLIENT_PATH,
//   }
// };

// module.exports = nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "fs": false,
        "net": false,
        "tls": false,
        "crypto": false,
        "path": false,
        "os": false,
        "stream": false,
        "buffer": false,
        "@azure/app-configuration": false
      };
    }
    return config;
  },
  // Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['oracledb'],
  env: {
    ORACLE_CLIENT_PATH: process.env.ORACLE_CLIENT_PATH,
  }
};

module.exports = nextConfig;