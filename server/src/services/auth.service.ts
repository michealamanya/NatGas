import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../database/client.js';
import { config } from '../config/index.js';
import { SafeUser } from '../types/index.js';
import { User } from '@prisma/client';

// ==================== PASSWORD ====================

/**
 * Hash a plain-text password using argon2.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 2,
  });
}

/**
 * Verify a plain-text password against a stored argon2 hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Validate password strength.
 * Rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

// ==================== SESSIONS ====================

/**
 * Create a new session record and return the session token.
 */
export async function createSession(
  userId: string,
  ip?: string,
  userAgent?: string,
): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(
    Date.now() + config.auth.sessionExpiryDays * 24 * 60 * 60 * 1000,
  );

  await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress: ip,
      userAgent,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate a session token. Returns the SafeUser if valid; null otherwise.
 */
export async function validateSession(token: string): Promise<SafeUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Update lastUsedAt
  await prisma.session
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  const u = session.user;
  if (u.status !== 'ACTIVE') return null;

  return toSafeUser(u);
}

/**
 * Invalidate (delete) a single session by token.
 */
export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

/**
 * Invalidate all sessions for a user.
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

// ==================== PASSWORD RESETS ====================

/**
 * Generate a password reset token for a user.
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + config.auth.passwordResetExpiryHours * 60 * 60 * 1000,
  );

  await prisma.passwordReset.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

/**
 * Validate a password reset token.
 * Returns the PasswordReset record if valid; null otherwise.
 */
export async function validatePasswordResetToken(
  token: string,
): Promise<{ id: string; userId: string } | null> {
  const record = await prisma.passwordReset.findUnique({ where: { token } });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;

  return { id: record.id, userId: record.userId };
}

/**
 * Mark a password reset token as used.
 */
export async function markPasswordResetUsed(id: string): Promise<void> {
  await prisma.passwordReset.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

// ==================== LOGIN TRACKING ====================

/**
 * Track a login attempt. On success: reset counter & lockout. On failure: increment + set lockout.
 */
export async function trackLoginAttempt(
  userId: string,
  success: boolean,
  ip?: string,
): Promise<void> {
  if (success) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    const shouldLock = newAttempts >= config.auth.maxLoginAttempts;

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000)
          : user.lockedUntil,
      },
    });
  }
}

/**
 * Check if an account is currently locked out.
 */
export function isAccountLocked(user: Pick<User, 'lockedUntil'>): boolean {
  if (!user.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

// ==================== HELPERS ====================

export function toSafeUser(u: User): SafeUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    avatarUrl: u.avatarUrl,
  };
}
