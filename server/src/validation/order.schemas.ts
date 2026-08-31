import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
export const createOrderSchema = z.object({ items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(1000) })).min(1), deliveryAddress: z.string().min(5).max(500), district: z.string().min(2).max(100), phone: z.string().min(7).max(30), notes: z.string().max(1000).optional() });
export const updateOrderSchema = z.object({ status: z.nativeEnum(OrderStatus).optional(), staffNotes: z.string().max(1000).optional() });
