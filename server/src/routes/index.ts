import { Router, Request, Response } from 'express';
import path from 'path';
import express from 'express';
import { config } from '../config/index.js';
import { errorResponse } from '../types/index.js';
import { prisma } from '../database/client.js';

import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin.routes.js';

const router: Router = Router();

// ==================== Health check ====================
router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    services: {
      database: dbStatus,
    },
  });
});

// ==================== Auth routes ====================
router.use('/auth', authRoutes);

// ==================== Public routes ====================
router.use('/', publicRoutes);

// ==================== Admin routes ====================
router.use('/admin', adminRoutes);

// ==================== Serve uploads if local storage ====================
if (config.storage.provider === 'local') {
  const uploadsPath = path.resolve(config.storage.localPath);
  router.use(
    '/uploads',
    express.static(uploadsPath, {
      maxAge: '1d',
      etag: true,
    }),
  );
}

// ==================== 404 handler for unmatched API routes ====================
router.use((_req: Request, res: Response) => {
  res.status(404).json(errorResponse('The requested endpoint does not exist'));
});

export default router;
