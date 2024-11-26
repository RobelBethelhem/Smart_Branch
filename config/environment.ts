const ENV = {
    development: {
      apiBaseUrl: 'http://localhost:5000',
    },
    production: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://your-production-api.com',
    },
  };
  
  const getEnvironment = () => {
    const env = process.env.NODE_ENV || 'development';
    return ENV[env as keyof typeof ENV];
  };
  
  export const config = getEnvironment();