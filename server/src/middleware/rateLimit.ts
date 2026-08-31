import rateLimit from 'express-rate-limit';
import { errorResponse } from '../types/index.js';
import { config } from '../config/index.js';

const standardHandler = (message: string) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(errorResponse(message));
    },
  });

/**
 * generalLimiter - 100 requests per 15 minutes for general API use.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Development tools and the Vite client make many harmless requests. Keep
  // production protection while preventing local catalogue browsing lockouts.
  max: config.isDevelopment ? 5000 : 100,
  skip: (req) => req.path.startsWith('/uploads'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse('Too many requests. Please try again later.'));
  },
});

/**
 * authLimiter - 10 requests per 15 minutes for login endpoint.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many login attempts. Please try again in 15 minutes.'),
    );
  },
});

/**
 * contactLimiter - 5 requests per 15 minutes for contact form.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many contact submissions. Please try again later.'),
    );
  },
});

/**
 * uploadLimiter - 20 requests per 15 minutes for file uploads.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many upload requests. Please try again later.'),
    );
  },
});
