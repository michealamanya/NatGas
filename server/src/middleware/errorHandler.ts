import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { errorResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Central Express error handling middleware.
 * Must be registered LAST in the middleware chain (4 arguments).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // ---- Zod validation errors ----
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_root';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    res.status(400).json(errorResponse('Validation failed', errors));
    return;
  }

  // ---- Known operational application errors ----
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', {
        message: err.message,
        code: err.code,
        stack: config.isDevelopment ? err.stack : undefined,
        path: req.path,
        method: req.method,
      });
    }
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // ---- Prisma known request errors ----
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
      res.status(409).json(errorResponse(`A record with this ${target} already exists.`));
      return;
    }
    if (err.code === 'P2025') {
      // Record not found
      res.status(404).json(errorResponse('The requested record was not found.'));
      return;
    }
    if (err.code === 'P2003') {
      // Foreign key constraint
      res.status(400).json(errorResponse('Related record not found.'));
      return;
    }
    logger.error('Prisma known request error', {
      code: err.code,
      meta: err.meta,
      path: req.path,
    });
    res.status(500).json(errorResponse('Database error occurred.'));
    return;
  }

  // ---- Prisma validation errors ----
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { path: req.path });
    res.status(400).json(errorResponse('Invalid database query parameters.'));
    return;
  }

  // ---- Multer errors ----
  if (err instanceof Error && err.message.startsWith('MulterError')) {
    res.status(400).json(errorResponse(err.message));
    return;
  }

  // ---- Unknown / unexpected errors ----
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled error', {
    message,
    stack: config.isDevelopment ? stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json(
    errorResponse(
      config.isProduction ? 'Internal server error' : message,
    ),
  );
}
