import { z } from 'zod';

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? '1', 10))),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, parseInt(v ?? '20', 10)))),
});

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
});
