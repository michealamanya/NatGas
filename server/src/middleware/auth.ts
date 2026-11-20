import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, SafeUser } from '../types/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { validateSession } from '../services/auth.service.js';
import { UserRole } from '@prisma/client';
import { getUserRoles, ROLE_HIERARCHY } from '../types/index.js';
import { prisma } from '../database/client.js';

/**
 * Core session validation - extracts token from cookie and validates it.
 * Returns SafeUser if valid, null otherwise.
 */
async function resolveUser(req: AuthenticatedRequest): Promise<{ user: SafeUser; token: string } | null> {
  const token: string | undefined = req.cookies?.natgas_session;
  if (!token) return null;

  const user = await validateSession(token);
  if (!user) return null;

  return { user, token };
}

async function allowedByAccessPolicy(req: AuthenticatedRequest): Promise<boolean> {
  if (!req.user) return false;
  if (getUserRoles(req.user).includes('SUPER_ADMIN')) return true;
  const policy = await prisma.userAccessPolicy.findUnique({ where: { userId: req.user.id } });
  if (!policy) return true;
  if (!policy.canLogin) return false;
  const now = new Date();
  if (policy.allowedFrom && now < policy.allowedFrom) return false;
  if (policy.allowedUntil && now > policy.allowedUntil) return false;
  const weekdays = policy.allowedWeekdays as number[] | null;
  if (weekdays?.length && !weekdays.includes(now.getDay())) return false;
  const ipAllowlist = policy.ipAllowlist as string[] | null;
  const requestIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
  if (ipAllowlist?.length && !ipAllowlist.includes(requestIp)) return false;
  const modules = policy.allowedModules as string[] | null;
  if (modules?.length) {
    const path = (req.originalUrl ?? '').toLowerCase();
    const moduleMap: Record<string, string> = {
      dashboard: 'Overview', products: 'Products', services: 'Services', media: 'Media',
      experience: 'Experience', locations: 'Locations', orders: 'Orders', news: 'News',
      jobs: 'Jobs', applications: 'Jobs', contact: 'Messages', users: 'Users',
      audit: 'Audit', auditLogs: 'Audit', settings: 'Settings', marketing: 'Marketing',
    };
    const segment = path.split('?')[0].split('/').find((part: string) => moduleMap[part]);
    if (segment && !modules.includes(moduleMap[segment])) return false;
  }
  return true;
}

/**
 * requireAuth - throws 401 if not authenticated.
 * Attaches req.user and req.sessionToken on success.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const result = await resolveUser(req);
  if (!result) {
    return next(new AuthenticationError('Authentication required'));
  }
  req.user = result.user;
  req.sessionToken = result.token;
  if (!getUserRoles(req.user).includes('SUPER_ADMIN') && !(await allowedByAccessPolicy(req))) {
    return next(new AuthorizationError('This account access is restricted'));
  }
  next();
}

/**
 * requireRole(...roles) - throws 403 if user's role is not in the list or doesn't meet hierarchy.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    const result = await resolveUser(req);
    if (!result) {
      return next(new AuthenticationError('Authentication required'));
    }
    req.user = result.user;
    req.sessionToken = result.token;

    const userRoles = getUserRoles(req.user!);
    if (userRoles.includes('SUPER_ADMIN')) {
      next();
      return;
    }
    if (!(await allowedByAccessPolicy(req))) {
      return next(new AuthorizationError('This account access is restricted'));
    }
    const hasRole = roles.some((role) => {
      return userRoles.some((userRole) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);
    });

    if (!hasRole) {
      return next(new AuthorizationError('Insufficient permissions'));
    }
    next();
  };
}

/**
 * optionalAuth - attaches user if present but doesn't throw.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const result = await resolveUser(req);
  if (result) {
    req.user = result.user;
    req.sessionToken = result.token;
  }
  next();
}
