import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// GET /api/locations
export async function listLocations(_req: Request, res: Response): Promise<void> {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: [{ isHeadquarters: 'desc' }, { displayOrder: 'asc' }],
  });
  res.status(200).json(successResponse(locations));
}

// GET /api/admin/locations
export async function adminListLocations(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const locations = await prisma.location.findMany({
    orderBy: [{ isHeadquarters: 'desc' }, { displayOrder: 'asc' }],
  });
  res.status(200).json(successResponse(locations));
}

// POST /api/admin/locations
export async function createLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;

  // Ensure only one HQ
  if (data.isHeadquarters) {
    await prisma.location.updateMany({
      where: { isHeadquarters: true },
      data: { isHeadquarters: false },
    });
  }

  const location = await prisma.location.create({
    data: { ...data, createdById: req.user!.id },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_LOCATION',
    resource: 'locations',
    resourceId: location.id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(location, 'Location created'));
}

// PUT /api/admin/locations/:id
export async function updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Location');

  const data = req.body;

  if (data.isHeadquarters && !existing.isHeadquarters) {
    await prisma.location.updateMany({
      where: { isHeadquarters: true, id: { not: id } },
      data: { isHeadquarters: false },
    });
  }

  const location = await prisma.location.update({ where: { id }, data });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_LOCATION',
    resource: 'locations',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(location, 'Location updated'));
}

// DELETE /api/admin/locations/:id
export async function deleteLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Location');

  await prisma.location.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_LOCATION',
    resource: 'locations',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Location deleted'));
}
