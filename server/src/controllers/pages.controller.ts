import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { createSlug, createUniqueSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = createSlug(title);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = createUniqueSlug(title, counter++);
  }
  return slug;
}

// GET /api/pages/:slug
export async function getPageBySlug(req: Request, res: Response): Promise<void> {
  const page = await prisma.page.findFirst({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
  });
  if (!page) throw new NotFoundError('Page');
  res.status(200).json(successResponse(page));
}

// GET /api/admin/pages
export async function adminListPages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { status, search } = req.query as Record<string, string>;

  const where: Prisma.PageWhereInput = {};
  if (status) where.status = status as ContentStatus;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, pages] = await Promise.all([
    prisma.page.count({ where }),
    prisma.page.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(pages, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/admin/pages
export async function createPage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;
  const slug = data.slug ? createSlug(data.slug) : await generateUniqueSlug(data.title);

  // Ensure slug is unique
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) throw new AppError('A page with this slug already exists', 409);

  const page = await prisma.page.create({
    data: {
      ...data,
      slug,
      createdById: req.user!.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_PAGE',
    resource: 'pages',
    resourceId: page.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(page, 'Page created'));
}

// PUT /api/admin/pages/:id
export async function updatePage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Page');

  const data = req.body;
  let slug = existing.slug;

  if (data.slug && data.slug !== existing.slug) {
    slug = createSlug(data.slug);
    const slugConflict = await prisma.page.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugConflict) throw new AppError('A page with this slug already exists', 409);
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt:
        data.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_PAGE',
    resource: 'pages',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(page, 'Page updated'));
}

// DELETE /api/admin/pages/:id
export async function deletePage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Page');

  if (existing.isSystem) {
    throw new AppError('System pages cannot be deleted', 400);
  }

  await prisma.page.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_PAGE',
    resource: 'pages',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Page deleted'));
}
