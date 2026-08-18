import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  sessionToken?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
  avatarUrl?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  const totalPages = Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };
}

export function successResponse<T>(data: T, message?: string, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, message, meta };
}

export function errorResponse(message: string, errors?: Record<string, string[]>): ApiResponse {
  return { success: false, message, errors };
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  CONTENT_MANAGER: 60,
  EDITOR: 40,
  HR: 40,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Role-based permission matrix
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users:read', 'users:write',
    'products:read', 'products:write', 'products:delete',
    'services:read', 'services:write', 'services:delete',
    'news:read', 'news:write', 'news:delete',
    'jobs:read', 'jobs:write', 'jobs:delete',
    'applications:read', 'applications:write',
    'locations:read', 'locations:write', 'locations:delete',
    'media:read', 'media:write', 'media:delete',
    'contact:read', 'contact:write',
    'faqs:read', 'faqs:write', 'faqs:delete',
    'pages:read', 'pages:write', 'pages:delete',
    'settings:read',
    'audit:read',
  ],
  EDITOR: [
    'products:read', 'products:write',
    'services:read', 'services:write',
    'news:read', 'news:write',
    'pages:read', 'pages:write',
    'media:read', 'media:write',
    'faqs:read', 'faqs:write',
    'locations:read',
  ],
  HR: [
    'jobs:read', 'jobs:write', 'jobs:delete',
    'applications:read', 'applications:write',
    'media:read', 'media:write',
  ],
  CONTENT_MANAGER: [
    'products:read', 'products:write',
    'services:read', 'services:write',
    'news:read', 'news:write', 'news:delete',
    'pages:read', 'pages:write', 'pages:delete',
    'media:read', 'media:write', 'media:delete',
    'faqs:read', 'faqs:write', 'faqs:delete',
    'locations:read',
  ],
} as const;

export function hasPermission(role: UserRole, permission: string): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role] as readonly string[];
  return permissions.includes(permission) || permissions.includes('*');
}
