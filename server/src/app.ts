import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app: express.Express = express();

// ==================== Security headers ====================
app.use(
  helmet({
    // The Vite app runs on port 5173 in development while local media is served
    // by this API on port 3001. Uploaded public images must be embeddable by
    // the website, so they cannot use Helmet's restrictive same-origin policy.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', ...(config.storage.s3.cdnUrl ? [config.storage.s3.cdnUrl] : [])],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// ==================== CORS ====================
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman) in dev
      if (!origin && !config.isProduction) return callback(null, true);
      if (!origin || config.cors.origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
  }),
);

// ==================== Compression ====================
app.use(compression());

// ==================== Cookie parser ====================
app.use(cookieParser());

// ==================== Body parsers ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== Request logger ====================
app.use(requestLogger);

// ==================== General rate limiter ====================
app.use(`${config.server.apiPrefix}`, generalLimiter);

// ==================== Routes ====================
app.use(config.server.apiPrefix, routes);

// ==================== Error handler (must be last) ====================
app.use(errorHandler);

export default app;
