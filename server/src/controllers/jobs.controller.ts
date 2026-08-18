import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { createAuditLog } from '../services/audit.service.js';
import { uploadFile } from '../services/storage.service.js';
import { sendJobApplicationConfirmation } from '../services/email.service.js';
import { createSlug, createUniqueSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
type ApplicationStatus = 'NEW' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'HIRED';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
import path from 'path';
import crypto from 'crypto';

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = createSlug(title);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.job.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = createUniqueSlug(title, counter++);
  }
  return slug;
}

// ==================== PUBLIC ====================

// GET /api/jobs
export async function listPublishedJobs(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { department, type, search } = req.query as Record<string, string>;

  const where: Prisma.JobWhereInput = {
    status: 'PUBLISHED',
    OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
  };
  if (department) where.department = { contains: department, mode: 'insensitive' };
  if (type) where.employmentType = type as Prisma.EnumEmploymentTypeFilter['equals'];
  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(jobs, undefined, buildPaginationMeta(total, pagination)));
}

// GET /api/jobs/:slug
export async function getJobBySlug(req: Request, res: Response): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
  });
  if (!job) throw new NotFoundError('Job');
  res.status(200).json(successResponse(job));
}

// POST /api/jobs/:id/apply
export async function applyForJob(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const job = await prisma.job.findFirst({
    where: { id, status: 'PUBLISHED' },
  });
  if (!job) throw new NotFoundError('Job');

  // Check deadline
  if (job.deadline && job.deadline < new Date()) {
    throw new AppError('The application deadline for this position has passed', 400);
  }

  const { fullName, email, phone, coverLetter, linkedInUrl } = req.body as {
    fullName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    linkedInUrl?: string;
  };

  let cvUrl: string | undefined;

  // Handle CV upload if file present
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (file) {
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('CV must be a PDF or Word document', 400);
    }
    const ext = path.extname(file.originalname);
    const filename = `cv-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const result = await uploadFile(file.buffer ?? Buffer.alloc(0), filename, file.mimetype, 'cvs');
    cvUrl = result.url;
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId: id,
      fullName,
      email,
      phone,
      coverLetter,
      linkedInUrl,
      cvUrl,
    },
  });

  // Send confirmation email (non-blocking)
  sendJobApplicationConfirmation(email, job.title, fullName).catch(() => undefined);

  res.status(201).json(successResponse(
    { id: application.id },
    'Application submitted successfully',
  ));
}

// ==================== ADMIN ====================

// GET /api/admin/jobs
export async function adminListJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { status, search } = req.query as Record<string, string>;

  const where: Prisma.JobWhereInput = {};
  if (status) where.status = status as ContentStatus;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(jobs, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/admin/jobs
export async function createJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;
  const slug = await generateUniqueSlug(data.title);

  const job = await prisma.job.create({
    data: {
      ...data,
      slug,
      createdById: req.user!.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_JOB',
    resource: 'jobs',
    resourceId: job.id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(job, 'Job created'));
}

// PUT /api/admin/jobs/:id
export async function updateJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Job');

  const data = req.body;
  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    slug = await generateUniqueSlug(data.title, id);
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt:
        data.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_JOB',
    resource: 'jobs',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(job, 'Job updated'));
}

// DELETE /api/admin/jobs/:id
export async function deleteJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Job');

  await prisma.jobApplication.deleteMany({ where: { jobId: id } });
  await prisma.job.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DELETE_JOB',
    resource: 'jobs',
    resourceId: id,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Job deleted'));
}

// GET /api/admin/applications
export async function listApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { jobId, status, search } = req.query as Record<string, string>;

  const where: Prisma.JobApplicationWhereInput = {};
  if (jobId) where.jobId = jobId;
  if (status) where.status = status as ApplicationStatus;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, applications] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      include: { job: { select: { id: true, title: true, slug: true } } },
      orderBy: { appliedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(applications, undefined, buildPaginationMeta(total, pagination)));
}

// GET /api/admin/applications/:id
export async function getApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: req.params.id },
    include: { job: true },
  });
  if (!application) throw new NotFoundError('Application');
  res.status(200).json(successResponse(application));
}

// PUT /api/admin/applications/:id/status
export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, notes } = req.body as { status: ApplicationStatus; notes?: string };

  const existing = await prisma.jobApplication.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Application');

  const application = await prisma.jobApplication.update({
    where: { id },
    data: { status, notes },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_APPLICATION_STATUS',
    resource: 'applications',
    resourceId: id,
    metadata: { status },
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(application, 'Application status updated'));
}
