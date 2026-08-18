import morgan from 'morgan';
import { Request, Response, RequestHandler } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Pipe morgan output through winston
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Morgan-based HTTP request logger.
 * Development: detailed 'dev' format.
 * Production: 'combined' (Apache combined log format).
 */
export const requestLogger: RequestHandler = config.isProduction
  ? morgan('combined', { stream })
  : morgan('dev', {
      stream,
      skip: (req: Request, _res: Response) => {
        // Skip health check noise in dev
        return req.path === '/api/health';
      },
    });
