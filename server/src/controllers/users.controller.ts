import { Response } from 'express';
import { prisma } from '../database/client.js';
import {
  AuthenticatedRequest,
  successResponse,
  parsePagination,
  buildPaginationMeta,
} from '../types/index.js';
import { NotFoundError, ConflictError, AppError } from '../utils/errors.js';
import {
  hashPassword,
  toSafeUser,
} from '../services/auth.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { Prisma } from '@prisma/client';
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'HR' | 'CONTENT_MANAGER' | 'CUSTOMER';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
import crypto from 'crypto';

function getIp(req: AuthenticatedRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// GET /api/users
export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { search, role, status } = req.query as Record<string, string>;

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role as UserRole;
  if (status) where.status = status as UserStatus;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        phone: true,
        department: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  res.status(200).json(successResponse(users, undefined, buildPaginationMeta(total, pagination)));
}

// POST /api/users
export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email, username, firstName, lastName, role, phone, department, password, sendWelcomeEmailFlag } =
    req.body as {
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      role?: UserRole;
      phone?: string;
      department?: string;
      password?: string;
      sendWelcomeEmailFlag?: boolean;
      sendWelcomeEmail?: boolean;
    };

  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new ConflictError(
      existing.email === email ? 'Email already exists' : 'Username already exists',
    );
  }

  const tempPassword = password ?? crypto.randomBytes(12).toString('base64url');
  // ADMINs can administer website staff, but cannot create a second SUPER_ADMIN.
  if (req.user!.role === 'ADMIN' && role === 'SUPER_ADMIN') {
    throw new AppError('Only a Super Administrator can create a Super Administrator account', 403);
  }
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      firstName,
      lastName,
      role: role ?? 'EDITOR',
      phone,
      department,
      passwordHash,
      mustChangePassword: !password,
      createdById: req.user!.id,
    },
  });

  if (req.body.sendWelcomeEmail !== false) {
    await sendWelcomeEmail(email, firstName, !password ? tempPassword : undefined);
  }

  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE_USER',
    resource: 'users',
    resourceId: user.id,
    metadata: { email, role: user.role },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(successResponse(toSafeUser(user), 'User created successfully'));
}

// GET /api/users/:id
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
      phone: true,
      department: true,
      lastLoginAt: true,
      lastLoginIp: true,
      emailVerified: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  res.status(200).json(successResponse(user));
}

// PUT /api/users/:id
export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { email, username, firstName, lastName, phone, department, avatarUrl } = req.body as {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    avatarUrl?: string;
  };

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('User');

  // Check for email/username conflicts
  if (email && email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) throw new ConflictError('Email already in use');
  }
  if (username && username !== existing.username) {
    const conflict = await prisma.user.findUnique({ where: { username } });
    if (conflict) throw new ConflictError('Username already in use');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { email, username, firstName, lastName, phone, department, avatarUrl },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_USER',
    resource: 'users',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(toSafeUser(user), 'User updated'));
}

// PUT /api/users/:id/status
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: UserStatus };

  // Prevent SUPER_ADMIN from deactivating themselves
  if (id === req.user!.id) throw new AppError('Cannot change your own account status', 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  await prisma.user.update({ where: { id }, data: { status } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_USER_STATUS',
    resource: 'users',
    resourceId: id,
    metadata: { status },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, `User status updated to ${status}`));
}

// PUT /api/users/:id/role
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };

  if (id === req.user!.id) throw new AppError('Cannot change your own role', 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  // Customer accounts can be supported (status and passwords) but cannot be
  // converted into privileged staff accounts through the customer directory.
  if (user.role === 'CUSTOMER' || role === 'CUSTOMER') {
    throw new AppError('Customer accounts cannot be assigned staff roles', 400);
  }

  // An ADMIN has elevated website-management access, including assignment of
  // operational roles, but cannot change the Super Administrator boundary.
  if (req.user!.role === 'ADMIN' && (user.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN')) {
    throw new AppError('Only a Super Administrator can manage Super Administrator accounts', 403);
  }

  await prisma.user.update({ where: { id }, data: { role } });

  await createAuditLog({
    userId: req.user!.id,
    action: 'UPDATE_USER_ROLE',
    resource: 'users',
    resourceId: id,
    metadata: { role },
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, `User role updated to ${role}`));
}

// POST /api/users/:id/reset-password
export async function adminResetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  const tempPassword = crypto.randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  await sendWelcomeEmail(user.email, user.firstName, tempPassword);

  await createAuditLog({
    userId: req.user!.id,
    action: 'ADMIN_RESET_PASSWORD',
    resource: 'users',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Password reset and sent to user email'));
}

export async function adminSetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User');
  if (user.role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') throw new AppError('Only a Super Administrator can change this password', 403);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(req.body.password), mustChangePassword: true } });
  await createAuditLog({ userId:req.user!.id, action:'ADMIN_SET_PASSWORD', resource:'users', resourceId:user.id, ipAddress:getIp(req), userAgent:req.headers['user-agent'] });
  res.json(successResponse(null, 'Password updated. The user must change it at next sign-in.'));
}

// DELETE /api/users/:id
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (id === req.user!.id) throw new AppError('Cannot delete your own account', 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  // Soft delete: deactivate rather than hard delete
  await prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DEACTIVATE_USER',
    resource: 'users',
    resourceId: id,
    ipAddress: getIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'User deactivated'));
}
