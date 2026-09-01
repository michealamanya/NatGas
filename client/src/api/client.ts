export type ApiResult<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> ?? {}),
  };
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  const body = await response.json().catch(() => ({ message: 'Unable to reach NATGAS services.' }));
  if (!response.ok) throw new Error(body.message ?? 'Request failed.');
  return body;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  cylinderSize?: string;
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  features?: string[];
  safetyInfo?: string;
  specifications?: Record<string, string>;
  isAvailable: boolean;
  isFeatured: boolean;
  status: string;
  displayOrder: number;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  features?: string[];
  icon?: string;
  imageUrl?: string;
  isFeatured: boolean;
  status: string;
}

export interface MediaItem {
  id: string;
  url: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featuredImage?: string;
  status: string;
  publishedAt?: string;
  updatedAt: string;
  author?: { firstName: string; lastName: string };
  category?: { name: string };
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  department?: string;
  location?: string;
  employmentType: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salaryRange?: string;
  deadline?: string;
  status: string;
  isFeatured: boolean;
  publishedAt?: string;
  _count?: { applications: number };
}

export interface Location {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  isHeadquarters: boolean;
  isActive: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  displayOrder: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  phone?: string;
}

export interface DashboardStats {
  products: number;
  services: number;
  newsArticles: number;
  jobs: number;
  jobApplications: number;
  contactMessages: number;
  users: number;
  locations: number;
}
