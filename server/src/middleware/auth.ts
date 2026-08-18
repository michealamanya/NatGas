import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, SafeUser } from '../types/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { validateSession } from '../services/auth.service.js';
import { UserRole } from '@prisma/client';
import { ROLE_HIERARCHY } from '../types/index.js';

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

    const userRoleLevel = ROLE_HIERARCHY[req.user!.role];
    const hasRole = roles.some((role) => {
      // User satisfies if their level >= any required role level
      return userRoleLevel >= ROLE_HIERARCHY[role];
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
