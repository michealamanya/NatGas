import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { createSlug, createUniqueSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = createSlug(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = createUniqueSlug(name, counter++);
  }
  return slug;
}

// GET /api/services
export async function listPublishedServices(_req: Request, res: Response): Promise<void> {
  const services = await prisma.service.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
  res.status(200).json(successResponse(services));
}

// GET /api/services/:slug
export async function getServiceBySlug(req: Request, res: Response): Promise<void> {
  const service = await prisma.service.findFirst({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
  });
  if (!service) throw new NotFoundError('Service');
  res.status(200).json(successResponse(service));
}

// GET /api/admin/services
export async function adminListServices(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { status, search } = req.query as Record<string, string>;

  const where: Prisma.ServiceWhereInput = {};
  if (status) where.status = status as ContentStatus;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, services] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(services, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/admin/services
export async function createService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;
  const slug = await generateUniqueSlug(data.name);

  const service = await prisma.service.create({
    data: { ...data, slug, createdById: req.user!.id },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_SERVICE',
    resource: 'services',
    resourceId: service.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(service, 'Service created'));
}

// PUT /api/admin/services/:id
export async function updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Service');

  const data = req.body;
  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, id);
  }

  const service = await prisma.service.update({ where: { id }, data: { ...data, slug } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_SERVICE',
    resource: 'services',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(service, 'Service updated'));
}

// DELETE /api/admin/services/:id
export async function deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Service');

  await prisma.service.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_SERVICE',
    resource: 'services',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Service deleted'));
}
