import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const createNewsCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateNewsCategorySchema = createNewsCategorySchema.partial();

export const createNewsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  summary: z.string().max(500).optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().url().optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updateNewsArticleSchema = createNewsArticleSchema.partial();

export type CreateNewsArticleInput = z.infer<typeof createNewsArticleSchema>;
export type UpdateNewsArticleInput = z.infer<typeof updateNewsArticleSchema>;
export type CreateNewsCategoryInput = z.infer<typeof createNewsCategorySchema>;
