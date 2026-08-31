import { Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { AuthenticatedRequest, successResponse, errorResponse } from '../types/index.js';
import { AppError, AuthenticationError, NotFoundError } from '../utils/errors.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  invalidateSession,
  invalidateAllSessions,
  generatePasswordResetToken,
  validatePasswordResetToken,
  markPasswordResetUsed,
  trackLoginAttempt,
  isAccountLocked,
  toSafeUser,
} from '../services/auth.service.js';
import { sendPasswordReset } from '../services/email.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { config } from '../config/index.js';

const COOKIE_NAME = 'natgas_session';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  maxAge: config.auth.sessionExpiryDays * 24 * 60 * 60 * 1000,
  path: '/',
};

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    'unknown'
  );
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic message to avoid user enumeration
    res.status(401).json(errorResponse('Invalid email or password'));
    return;
  }

  // Check account status
  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    res.status(401).json(errorResponse('Your account is disabled. Please contact support.'));
    return;
  }

  // Check lockout
  if (isAccountLocked(user)) {
    const lockoutEnd = user.lockedUntil!;
    const minutesLeft = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
    res.status(401).json(
      errorResponse(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`),
    );
    return;
  }

  const passwordValid = await verifyPassword(user.passwordHash, password);
  if (!passwordValid) {
    await trackLoginAttempt(user.id, false, ip);
    res.status(401).json(errorResponse('Invalid email or password'));
    return;
  }

  await trackLoginAttempt(user.id, true, ip);

  const token = await createSession(user.id, ip, userAgent);

  await createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    resource: 'auth',
    resourceId: user.id,
    ipAddress: ip,
    userAgent,
  });

  res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  res.status(200).json(
    successResponse(
      {
        user: toSafeUser(user),
        mustChangePassword: user.mustChangePassword,
      },
      'Login successful',
    ),
  );
}

// POST /api/auth/register - customer account for ordering only
export async function registerCustomer(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, phone, password } = req.body as { firstName: string; lastName: string; email: string; phone: string; password: string };
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError('An account with this email already exists. Please sign in.', 409);
  const username = `customer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const user = await prisma.user.create({ data: { firstName, lastName, email, phone, username, passwordHash: await hashPassword(password), role: 'CUSTOMER' } });
  const token = await createSession(user.id, getClientIp(req), req.headers['user-agent']);
  res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  res.status(201).json(successResponse({ user: toSafeUser(user) }, 'Account created. You can now submit your order request.'));
}

// POST /api/auth/logout
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];
  if (token) {
    await invalidateSession(token);
    await createAuditLog({
      userId: req.user?.id,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(200).json(successResponse(null, 'Logged out successfully'));
}

// GET /api/auth/me
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AuthenticationError('User not found');

  res.status(200).json(successResponse(toSafeUser(user)));
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === 'ACTIVE') {
    const token = await generatePasswordResetToken(user.id);
    const resetUrl = `${config.client.url}/reset-password?token=${token}`;
    await sendPasswordReset(user.email, resetUrl, user.firstName);
  }

  res.status(200).json(
    successResponse(
      null,
      'If that email exists, a reset link has been sent.',
    ),
  );
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };

  const record = await validatePasswordResetToken(token);
  if (!record) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  await markPasswordResetUsed(record.id);
  await invalidateAllSessions(record.userId);

  await createAuditLog({
    userId: record.userId,
    action: 'PASSWORD_RESET',
    resource: 'auth',
    resourceId: record.userId,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json(successResponse(null, 'Password reset successfully. Please log in.'));
}

// PUT /api/auth/change-password
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new NotFoundError('User');

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Invalidate all other sessions (keep current one)
  await invalidateAllSessions(user.id);
  const newToken = await createSession(user.id, getClientIp(req), req.headers['user-agent']);

  await createAuditLog({
    userId: user.id,
    action: 'CHANGE_PASSWORD',
    resource: 'auth',
    resourceId: user.id,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.cookie(COOKIE_NAME, newToken, SESSION_COOKIE_OPTIONS);
  res.status(200).json(successResponse(null, 'Password changed successfully'));
}
