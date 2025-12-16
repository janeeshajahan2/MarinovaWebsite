declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      FRONTEND_URL?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
