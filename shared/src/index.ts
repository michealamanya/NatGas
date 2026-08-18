export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'HR' | 'CONTENT_MANAGER';

export interface ApiEnvelope<T> { success: boolean; data: T; message?: string; }
