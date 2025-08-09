import { z } from 'zod';

// Validation schemas using Zod (already in dependencies)
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const createLeadSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number too long'),
  sectorId: z.string().min(1, 'Sector ID is required'),
  productIds: z.array(z.string()).min(1, 'At least one product must be selected')
});

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters').max(100, 'Campaign name too long'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name too long')
});

export const updateCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters').max(100, 'Campaign name too long').optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name too long').optional()
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100, 'Product name too long'),
  description: z.string().max(500, 'Description too long').optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100, 'Product name too long').optional(),
  description: z.string().max(500, 'Description too long').optional()
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['ADMIN', 'AGENT']).optional()
});

// Validation helper function
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};
