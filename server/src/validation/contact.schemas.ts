import { z } from 'zod';
import { ContactStatus } from '@prisma/client';

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(2, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const updateContactStatusSchema = z.object({
  status: z.nativeEnum(ContactStatus),
  notes: z.string().max(500).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
