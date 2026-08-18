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

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = createSlug(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = createUniqueSlug(name, counter++);
  }
  return slug;
}

// ==================== PUBLIC ENDPOINTS ====================

// GET /api/products
export async function listPublishedProducts(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { category, search, featured } = req.query as Record<string, string>;

  const where: Prisma.ProductWhereInput = {
    status: 'PUBLISHED',
    isAvailable: true,
  };
  if (category) where.category = { slug: category };
  if (featured === 'true') where.isFeatured = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(products, undefined, buildPaginationMeta(total, pagination)));
}

// GET /api/products/categories
export async function getPublicProductCategories(_req: Request, res: Response): Promise<void> {
  const categories = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  res.status(200).json(successResponse(categories));
}

// GET /api/products/:slug
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
    include: { category: true },
  });
  if (!product) throw new NotFoundError('Product');
  res.status(200).json(successResponse(product));
}

// ==================== ADMIN ENDPOINTS ====================

// GET /api/admin/products
export async function adminListProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { search, status, category } = req.query as Record<string, string>;

  const where: Prisma.ProductWhereInput = {};
  if (status) where.status = status as ContentStatus;
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, createdBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(products, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/admin/products
export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;
  const slug = await generateUniqueSlug(data.name);

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      createdById: req.user!.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_PRODUCT',
    resource: 'products',
    resourceId: product.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(product, 'Product created'));
}

// PUT /api/admin/products/:id
export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');

  const data = req.body;
  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, id);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      slug,
      updatedById: req.user!.id,
      publishedAt:
        data.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_PRODUCT',
    resource: 'products',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(product, 'Product updated'));
}

// DELETE /api/admin/products/:id (archive)
export async function archiveProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');

  await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'ARCHIVE_PRODUCT',
    resource: 'products',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Product archived'));
}

// PUT /api/admin/products/:id/publish
export async function toggleProductPublish(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: ContentStatus };

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');

  const product = await prisma.product.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  res.status(200).json(successResponse(product, `Product ${status.toLowerCase()}`));
}

// POST /api/admin/product-categories
export async function createProductCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, description, displayOrder, isActive } = req.body as {
    name: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  };

  const slug = createSlug(name);
  const existing = await prisma.productCategory.findUnique({ where: { slug } });
  if (existing) throw new ConflictError('A category with this name already exists');

  const category = await prisma.productCategory.create({
    data: { name, slug, description, displayOrder: displayOrder ?? 0, isActive: isActive ?? true },
  });

  res.status(201).json(successResponse(category, 'Category created'));
}

// PUT /api/admin/product-categories/:id
export async function updateProductCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product category');

  const data = req.body as {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  };

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = createSlug(data.name);
  }

  const category = await prisma.productCategory.update({
    where: { id },
    data: { ...data, slug },
  });

  res.status(200).json(successResponse(category, 'Category updated'));
}

// DELETE /api/admin/product-categories/:id
export async function deleteProductCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product category');

  // Unlink products from this category first
  await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.productCategory.delete({ where: { id } });

  res.status(200).json(successResponse(null, 'Category deleted'));
}
