import { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse } from '../types/index.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';

/**
 * Generate a unique order number in the format NG-{year}-{6-char suffix}.
 * The suffix combines a millisecond timestamp fragment and random noise so
 * concurrent requests are unlikely to collide, and the caller retries on the
 * rare event that the unique constraint is violated.
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  // Last 4 digits of current millisecond timestamp + 2 random chars
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `NG-${year}-${ts}${rand}`;
}

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { items, deliveryAddress, district, phone, deliveryMethod, preferredDate, notes } = req.body as {
    items: { productId: string; quantity: number }[];
    deliveryAddress: string;
    district: string;
    phone: string;
    deliveryMethod?: string;
    preferredDate?: string;
    notes?: string;
  };

  if (!Array.isArray(items) || !items.length) {
    throw new AppError('Add at least one product to your order.', 400);
  }
  if (!deliveryAddress || !district || !phone) {
    throw new AppError('Delivery address, district and phone are required.', 400);
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'PUBLISHED', isAvailable: true },
  });
  if (products.length !== productIds.length) {
    throw new AppError('One or more selected products are unavailable.', 400);
  }

  const byId = new Map(products.map((product) => [product.id, product]));

  // Validate quantities before attempting the DB write.
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
      throw new AppError('Each quantity must be between 1 and 1000.', 400);
    }
  }

  // Retry up to 3 times on the unlikely event of an orderNumber collision.
  let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
  let attempts = 0;
  while (!order && attempts < 3) {
    attempts++;
    try {
      order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: req.user!.id,
          deliveryAddress,
          district,
          phone,
          deliveryMethod: deliveryMethod ?? 'DELIVERY',
          preferredDate: preferredDate ? new Date(preferredDate) : null,
          notes,
          items: {
            create: items.map((item) => {
              const product = byId.get(item.productId)!;
              const unitPrice = product.price;
              return {
                productId: product.id,
                quantity: item.quantity,
                productName: product.name,
                unitPrice,
                lineTotal: unitPrice ? new Prisma.Decimal(unitPrice).mul(item.quantity) : null,
              };
            }),
          },
        },
        include: { items: true },
      });
    } catch (err) {
      // Unique constraint on orderNumber — retry with a fresh number.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        if (attempts >= 3) {
          throw new AppError('Unable to generate a unique order number. Please try again.', 500);
        }
        // Loop will retry with a new generateOrderNumber()
        continue;
      }
      throw err;
    }
  }

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_ORDER',
    resource: 'order',
    resourceId: order!.id,
    metadata: { orderNumber: order!.orderNumber },
  });

  res.status(201).json(
    successResponse(order, 'Order request received. Our team will confirm it shortly.'),
  );
}

export async function listMyOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  const orders = await prisma.order.findMany({ where: { customerId: req.user!.id }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  res.json(successResponse(orders));
}

export async function adminListOrders(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const orders = await prisma.order.findMany({ include: { customer: { select: { firstName: true, lastName: true, email: true } }, items: true }, orderBy: { createdAt: 'desc' } });
  res.json(successResponse(orders));
}

export async function adminUpdateOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { status, staffNotes } = req.body as { status?: OrderStatus; staffNotes?: string };
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Order');
  const order = await prisma.order.update({ where: { id: existing.id }, data: { status, staffNotes }, include: { customer: { select: { email: true, firstName: true } }, items: true } });
  await createAuditLog({ userId: req.user!.id, action: 'UPDATE_ORDER', resource: 'order', resourceId: order.id, metadata: { status: order.status } });
  res.json(successResponse(order, 'Order updated. The customer will be notified when email delivery is configured.'));
}
