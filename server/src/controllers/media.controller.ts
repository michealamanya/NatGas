import { Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { uploadFile, deleteFile } from '../services/storage.service.js';
import { config } from '../config/index.js';
import { Prisma } from '@prisma/client';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

function getIp(req: AuthenticatedRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// GET /api/media?folder=gallery|team
// Only curated public folders are exposed without a staff session.
export async function listPublicMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const folder = String(req.query.folder ?? 'gallery');
  if (!['gallery', 'team'].includes(folder)) throw new AppError('Unknown public media collection', 400);
  const media = await prisma.media.findMany({
    where: { folder, mimeType: { startsWith: 'image/' } },
    select: { id: true, url: true, altText: true, caption: true, width: true, height: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(successResponse(media));
}

// POST /api/admin/media/upload
export async function uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const file = (req as AuthenticatedRequest & { file?: Express.Multer.File }).file;
  if (!file) throw new AppError('No file provided', 400);

  const allowedTypes: string[] = [
    ...(config.upload.allowedImageTypes as unknown as string[]),
    ...(config.upload.allowedDocTypes as unknown as string[]),
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(
      `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      400,
    );
  }

  if (file.size > config.upload.maxFileSize) {
    throw new AppError(
      `File size exceeds maximum allowed size of ${config.upload.maxFileSize / (1024 * 1024)}MB`,
      400,
    );
  }

  const folder = req.body.folder ?? 'media';
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;

  // Get image dimensions if it's an image
  let width: number | undefined;
  let height: number | undefined;
  let buffer = file.buffer;

  if ((config.upload.allowedImageTypes as readonly string[]).includes(file.mimetype) && file.mimetype !== 'image/svg+xml') {
    try {
      const meta = await sharp(file.buffer).metadata();
      width = meta.width;
      height = meta.height;
      // Optimize images
      buffer = await sharp(file.buffer)
        .withMetadata()
        .toBuffer();
    } catch {
      // Not critical if sharp fails
    }
  }

  const result = await uploadFile(buffer ?? file.buffer, filename, file.mimetype, folder);

  const media = await prisma.media.create({
    data: {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: result.url,
      altText: req.body.altText,
      caption: req.body.caption,
      provider: result.provider,
      storageKey: result.storageKey,
      folder,
      width,
      height,
      uploadedById: req.user!.id,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPLOAD_MEDIA',
    resource: 'media',
    resourceId: media.id,
    metadata: { filename: file.originalname, size: file.size, mimeType: file.mimetype },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(media, 'File uploaded successfully'));
}

// GET /api/admin/media
export async function listMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { search, folder, mimeType } = req.query as Record<string, string>;

  const where: Prisma.MediaWhereInput = {};
  if (folder) where.folder = folder;
  if (mimeType) {
    if (mimeType === 'image') {
      where.mimeType = { startsWith: 'image/' };
    } else if (mimeType === 'document') {
      where.mimeType = { in: config.upload.allowedDocTypes as unknown as string[] };
    } else {
      where.mimeType = { contains: mimeType };
    }
  }
  if (search) {
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { altText: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, media] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(media, undefined, buildPaginationMeta(total, pagination)));
}

// PUT /api/admin/media/:id
export async function updateMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { altText, caption } = req.body as { altText?: string; caption?: string };

  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Media');

  const media = await prisma.media.update({
    where: { id },
    data: { altText, caption },
  });

  res.status(200).json(successResponse(media, 'Media updated'));
}

// DELETE /api/admin/media/:id
export async function deleteMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Media');

  // Delete from storage
  if (existing.storageKey) {
    await deleteFile(existing.storageKey, existing.provider).catch(() => undefined);
  }

  await prisma.media.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_MEDIA',
    resource: 'media',
    resourceId: id,
    metadata: { filename: existing.filename },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Media deleted'));
}
