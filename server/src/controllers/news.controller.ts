import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { createSlug, createUniqueSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = createSlug(title);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = createUniqueSlug(title, counter++);
  }
  return slug;
}

// ==================== PUBLIC ====================

// GET /api/news
export async function listPublishedArticles(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { category, search, featured } = req.query as Record<string, string>;

  const where: Prisma.NewsArticleWhereInput = { status: 'PUBLISHED' };
  if (category) where.category = { slug: category };
  if (featured === 'true') where.isFeatured = true;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, articles] = await Promise.all([
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(articles, undefined, buildPaginationMeta(total, pagination)));
}

// GET /api/news/categories
export async function getNewsCategories(_req: Request, res: Response): Promise<void> {
  const categories = await prisma.newsCategory.findMany({ orderBy: { name: 'asc' } });
  res.status(200).json(successResponse(categories));
}

// GET /api/news/:slug
export async function getArticleBySlug(req: Request, res: Response): Promise<void> {
  const article = await prisma.newsArticle.findFirst({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      category: true,
    },
  });
  if (!article) throw new NotFoundError('Article');
  res.status(200).json(successResponse(article));
}

// ==================== ADMIN ====================

// GET /api/admin/news
export async function adminListArticles(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { status, search, category } = req.query as Record<string, string>;

  const where: Prisma.NewsArticleWhereInput = {};
  if (status) where.status = status as ContentStatus;
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, articles] = await Promise.all([
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(articles, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/admin/news
export async function createArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;
  const slug = await generateUniqueSlug(data.title);

  const article = await prisma.newsArticle.create({
    data: {
      ...data,
      slug,
      createdById: req.user!.id,
      authorId: data.authorId ?? req.user!.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_NEWS_ARTICLE',
    resource: 'news',
    resourceId: article.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(article, 'Article created'));
}

// PUT /api/admin/news/:id
export async function updateArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.newsArticle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Article');

  const data = req.body;
  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    slug = await generateUniqueSlug(data.title, id);
  }

  const article = await prisma.newsArticle.update({
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
    action: 'UPDATE_NEWS_ARTICLE',
    resource: 'news',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(article, 'Article updated'));
}

// DELETE /api/admin/news/:id
export async function deleteArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.newsArticle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Article');

  await prisma.newsArticle.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_NEWS_ARTICLE',
    resource: 'news',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Article deleted'));
}

// POST /api/admin/news-categories
export async function createNewsCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, description } = req.body as { name: string; description?: string };
  const slug = createSlug(name);

  const existing = await prisma.newsCategory.findUnique({ where: { slug } });
  if (existing) throw new ConflictError('Category with this name already exists');

  const category = await prisma.newsCategory.create({ data: { name, slug, description } });
  res.status(201).json(successResponse(category, 'Category created'));
}

// PUT /api/admin/news-categories/:id
export async function updateNewsCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.newsCategory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('News category');

  const { name, description } = req.body as { name?: string; description?: string };
  let slug = existing.slug;
  if (name && name !== existing.name) slug = createSlug(name);

  const category = await prisma.newsCategory.update({
    where: { id },
    data: { name, slug, description },
  });

  res.status(200).json(successResponse(category, 'Category updated'));
}

// DELETE /api/admin/news-categories/:id
export async function deleteNewsCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.newsCategory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('News category');

  // Unlink articles
  await prisma.newsArticle.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.newsCategory.delete({ where: { id } });

  res.status(200).json(successResponse(null, 'Category deleted'));
}
