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
  // Docker image: a self-contained server (.next/standalone); set by the Dockerfile only,
  // so `npm run dev` / `npm run build` on a workstation behave exactly as before.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
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
  // Large files under public/ (face models, ONNX runtime, OpenCV, the idle-screen video) were
  // served with max-age=0, so every kiosk asked the server about each of them on every use and
  // downloaded tens of MB again whenever its cache was cleared. Let browsers keep them for a
  // week. To push a changed file sooner, give it a new name (or ?v=2) where it is referenced.
  async headers() {
    const weekly = [{ key: 'Cache-Control', value: 'public, max-age=604800' }];
    return [
      { source: '/models/:path*', headers: weekly },
      { source: '/ort/:path*', headers: weekly },
      { source: '/video/:path*', headers: weekly },
      { source: '/opencv.js', headers: weekly },
    ];
  },
  // Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['oracledb'],
  // Do not eagerly load every route (including database-backed API routes) at
  // server startup. Those routes load on their first request instead.
  experimental: {
    preloadEntriesOnStart: false,
  },
  env: {
    ORACLE_CLIENT_PATH: process.env.ORACLE_CLIENT_PATH,
  }
};

module.exports = nextConfig;
