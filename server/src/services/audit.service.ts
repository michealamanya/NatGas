import { prisma } from '../database/client.js';
import { Prisma } from '@prisma/client';
import { PaginationParams, buildPaginationMeta } from '../types/index.js';

export interface AuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create an audit log entry.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: input.metadata as object | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
    .catch(() => {
      // Never let audit log failures break the main request
    });
}

/**
 * Retrieve audit logs with optional filters and pagination.
 */
export async function getAuditLogs(
  filters: AuditLogFilters,
  pagination: PaginationParams,
) {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters.resource) where.resource = filters.resource;
  if (filters.resourceId) where.resourceId = filters.resourceId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  return {
    logs,
    meta: buildPaginationMeta(total, pagination),
  };
}
