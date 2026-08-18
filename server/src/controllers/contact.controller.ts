import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { sendContactNotification } from '../services/email.service.js';
import { Prisma } from '@prisma/client';
type ContactStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
import { config } from '../config/index.js';

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// POST /api/contact
export async function submitContact(req: Request, res: Response): Promise<void> {
  const { name, email, phone, subject, message } = req.body as {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  };

  const contact = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone,
      subject,
      message,
      ipAddress: getIp(req),
      userAgent: req.headers['user-agent'],
    },
  });

  // Notify admin via email (non-blocking)
  sendContactNotification(config.email.from, { name, email, phone, subject, message }).catch(
    () => undefined,
  );

  res.status(201).json(
    successResponse({ id: contact.id }, 'Message sent successfully. We will get back to you soon.'),
  );
}

// GET /api/admin/contact
export async function listContactMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { status, search } = req.query as Record<string, string>;

  const where: Prisma.ContactMessageWhereInput = {};
  if (status) where.status = status as ContactStatus;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(messages, undefined, buildPaginationMeta(total, pagination)));
}

// GET /api/admin/contact/:id
export async function getContactMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
  if (!message) throw new NotFoundError('Contact message');

  // Auto-mark as READ when first viewed
  if (message.status === 'UNREAD') {
    await prisma.contactMessage.update({ where: { id: message.id }, data: { status: 'READ' } });
  }

  res.status(200).json(successResponse(message));
}

// PUT /api/admin/contact/:id/status
export async function updateContactStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, notes } = req.body as { status: ContactStatus; notes?: string };

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Contact message');

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status, notes },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_CONTACT_STATUS',
    resource: 'contact',
    resourceId: id,
    metadata: { status },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(message, 'Message status updated'));
}
