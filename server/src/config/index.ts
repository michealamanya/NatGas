import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const config = {
  env: optionalEnv('NODE_ENV', 'development'),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',

  server: {
    port: parseInt(optionalEnv('PORT', '3001'), 10),
    host: optionalEnv('HOST', '0.0.0.0'),
    apiPrefix: '/api',
  },

  client: {
    url: optionalEnv('CLIENT_URL', 'http://localhost:5173'),
  },

  database: {
    url: optionalEnv('DATABASE_URL', ''),
  },

  auth: {
    sessionSecret: optionalEnv('SESSION_SECRET', 'natgas-dev-session-secret-change-in-production'),
    jwtSecret: optionalEnv('JWT_SECRET', 'natgas-dev-jwt-secret-change-in-production'),
    sessionExpiryDays: parseInt(optionalEnv('SESSION_EXPIRY_DAYS', '7'), 10),
    maxLoginAttempts: parseInt(optionalEnv('MAX_LOGIN_ATTEMPTS', '5'), 10),
    lockoutMinutes: parseInt(optionalEnv('LOCKOUT_MINUTES', '15'), 10),
    passwordResetExpiryHours: parseInt(optionalEnv('PASSWORD_RESET_EXPIRY_HOURS', '2'), 10),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:5173').split(','),
  },

  storage: {
    provider: optionalEnv('STORAGE_PROVIDER', 'local') as 'local' | 's3',
    localPath: optionalEnv('STORAGE_LOCAL_PATH', './uploads'),
    localUrlBase: optionalEnv('STORAGE_LOCAL_URL_BASE', 'http://localhost:3001/uploads'),
    s3: {
      bucket: optionalEnv('S3_BUCKET', ''),
      region: optionalEnv('S3_REGION', 'us-east-1'),
      accessKeyId: optionalEnv('S3_ACCESS_KEY_ID', ''),
      secretAccessKey: optionalEnv('S3_SECRET_ACCESS_KEY', ''),
      endpoint: optionalEnv('S3_ENDPOINT', ''),
      cdnUrl: optionalEnv('S3_CDN_URL', ''),
    },
  },

  email: {
    provider: optionalEnv('EMAIL_PROVIDER', 'smtp') as 'smtp' | 'ses' | 'sendgrid',
    from: optionalEnv('EMAIL_FROM', 'noreply@natgasuganda.com'),
    fromName: optionalEnv('EMAIL_FROM_NAME', 'NATGAS Uganda'),
    smtp: {
      host: optionalEnv('SMTP_HOST', 'smtp.mailtrap.io'),
      port: parseInt(optionalEnv('SMTP_PORT', '2525'), 10),
      user: optionalEnv('SMTP_USER', ''),
      pass: optionalEnv('SMTP_PASS', ''),
      secure: optionalEnv('SMTP_SECURE', 'false') === 'true',
    },
    sendgridApiKey: optionalEnv('SENDGRID_API_KEY', ''),
  },

  maps: {
    provider: optionalEnv('MAP_PROVIDER', 'openstreetmap'),
    apiKey: optionalEnv('MAP_API_KEY', ''),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 min
    maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
    loginWindowMs: parseInt(optionalEnv('LOGIN_RATE_LIMIT_WINDOW_MS', '900000'), 10),
    loginMaxRequests: parseInt(optionalEnv('LOGIN_RATE_LIMIT_MAX', '10'), 10),
  },

  upload: {
    maxFileSize: parseInt(optionalEnv('MAX_FILE_SIZE_MB', '10'), 10) * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
} as const;
