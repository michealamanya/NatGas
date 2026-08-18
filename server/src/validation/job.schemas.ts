import { z } from 'zod';
import { ContentStatus, EmploymentType, ApplicationStatus } from '@prisma/client';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  department: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.nativeEnum(EmploymentType).default('FULL_TIME'),
  description: z.string().min(1, 'Job description is required'),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salaryRange: z.string().max(100).optional(),
  deadline: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
  isFeatured: z.boolean().default(false),
});

export const updateJobSchema = createJobSchema.partial();

export const jobApplicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(150),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().max(20).optional(),
  coverLetter: z.string().max(3000).optional(),
  linkedInUrl: z.string().url('Invalid LinkedIn URL').optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  notes: z.string().max(1000).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
