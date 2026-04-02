import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 250),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  phonepeEnv: process.env.PHONEPE_ENV || 'sandbox',
  phonepeClientId: process.env.PHONEPE_CLIENT_ID,
  phonepeClientSecret: process.env.PHONEPE_CLIENT_SECRET,
  phonepeClientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
  phonepeRedirectUrl: process.env.PHONEPE_REDIRECT_URL,
  phonepeCallbackUrl: process.env.PHONEPE_CALLBACK_URL,
  phonepeFrontendSuccess: process.env.PHONEPE_REDIRECT_FRONTEND_SUCCESS || 'http://localhost:5173/payment-status?status=success',
  phonepeFrontendFailure: process.env.PHONEPE_REDIRECT_FRONTEND_FAILURE || 'http://localhost:5173/payment-status?status=failure',
  phonepeMerchantUserPrefix: process.env.PHONEPE_MERCHANT_USER_ID_PREFIX || 'ECOMUSR'
};
