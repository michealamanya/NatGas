import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { Prisma } from '@prisma/client';

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// GET /api/faqs
export async function listFaqs(req: Request, res: Response): Promise<void> {
  const { category } = req.query as Record<string, string>;

  const where: Prisma.FAQWhereInput = { isActive: true };
  if (category) where.category = category;

  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });

  res.status(200).json(successResponse(faqs));
}

// GET /api/admin/faqs
export async function adminListFaqs(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.status(200).json(successResponse(faqs));
}

// POST /api/admin/faqs
export async function createFaq(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { question, answer, category, displayOrder, isActive } = req.body as {
    question: string;
    answer: string;
    category?: string;
    displayOrder?: number;
    isActive?: boolean;
  };

  const faq = await prisma.fAQ.create({
    data: {
      question,
      answer,
      category,
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_FAQ',
    resource: 'faqs',
    resourceId: faq.id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(faq, 'FAQ created'));
}

// PUT /api/admin/faqs/:id
export async function updateFaq(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.fAQ.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('FAQ');

  const faq = await prisma.fAQ.update({ where: { id }, data: req.body });

  res.status(200).json(successResponse(faq, 'FAQ updated'));
}

// DELETE /api/admin/faqs/:id
export async function deleteFaq(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.fAQ.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('FAQ');

  await prisma.fAQ.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_FAQ',
    resource: 'faqs',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'FAQ deleted'));
}
