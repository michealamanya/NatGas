import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  cylinderSize: z.string().max(50).optional(),
  weight: z.number().positive().optional().nullable(),
  features: z.array(z.string()).optional(),
  safetyInfo: z.string().optional(),
  specifications: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  price: z.number().nonnegative().optional().nullable(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  currency: z.string().length(3).default('UGX'),
  isAvailable: z.boolean().default(true),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const publishProductSchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
