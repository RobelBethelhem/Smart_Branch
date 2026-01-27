const ENV = {
    development: {
      apiBaseUrl: 'http://10.1.1.181:5000',
    },
    production: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://10.1.1.181:5000',
    },
  };

  const getEnvironment = () => {
    const env = process.env.NODE_ENV || 'development';
    return ENV[env as keyof typeof ENV];
  };

  export const config = getEnvironment();

  // Export API base URL for easy access
  export const API_BASE_URL = config.apiBaseUrl;