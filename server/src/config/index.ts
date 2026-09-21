import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * In production, critical variables must be explicitly set.
 * Fail at startup with a clear message rather than silently using insecure defaults.
 */
function validateProductionEnv(): void {
  if (!IS_PRODUCTION) return;

  const required = ['DATABASE_URL', 'SESSION_SECRET', 'CORS_ORIGINS'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Production startup aborted. The following required environment variables are not set:\n  ${missing.join('\n  ')}\n\nCopy server/.env.example to server/.env and set all required values.`,
    );
  }

  // Reject unchanged development placeholder secrets
  const sessionSecret = process.env.SESSION_SECRET ?? '';
  if (sessionSecret.includes('dev') || sessionSecret.includes('change') || sessionSecret.length < 32) {
    throw new Error(
      'SESSION_SECRET looks like a development placeholder or is too short (minimum 32 characters). Set a strong random value in production.',
    );
  }
}

validateProductionEnv();

export const config = {
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  isDevelopment: NODE_ENV === 'development',

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
    // SESSION_SECRET has no safe fallback in production (validated above).
    // The dev placeholder is only used when NODE_ENV != production.
    sessionSecret: optionalEnv('SESSION_SECRET', 'natgas-dev-session-secret-not-for-production'),
    sessionExpiryDays: parseInt(optionalEnv('SESSION_EXPIRY_DAYS', '7'), 10),
    maxLoginAttempts: parseInt(optionalEnv('MAX_LOGIN_ATTEMPTS', '5'), 10),
    lockoutMinutes: parseInt(optionalEnv('LOCKOUT_MINUTES', '15'), 10),
    passwordResetExpiryHours: parseInt(optionalEnv('PASSWORD_RESET_EXPIRY_HOURS', '2'), 10),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
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
      host: optionalEnv('SMTP_HOST', 'localhost'),
      port: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
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
    // The admin console can publish several related records in one session;
    // keep a useful production guard without locking out normal CMS work.
    maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX', '300'), 10),
    loginWindowMs: parseInt(optionalEnv('LOGIN_RATE_LIMIT_WINDOW_MS', '900000'), 10),
    loginMaxRequests: parseInt(optionalEnv('LOGIN_RATE_LIMIT_MAX', '10'), 10),
  },

  upload: {
    maxFileSize: parseInt(optionalEnv('MAX_FILE_SIZE_MB', '10'), 10) * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    allowedDocTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/webm',
    ],
  },
} as const;
