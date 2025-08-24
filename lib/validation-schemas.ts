import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  sbu: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).default('AGENT'),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Campaign validation schemas
export const createCampaignSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required').max(255),
  organization_name: z.string().min(1, 'Organization name is required').max(255),
  uniqueLink: z.string().min(3, 'Unique link must be at least 3 characters').max(100)
    .regex(/^[a-zA-Z0-9-_]+$/, 'Unique link can only contain letters, numbers, hyphens, and underscores'),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  is_active: z.boolean().optional(),
});

// Lead validation schemas
export const createLeadSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format'),
  sectorId: z.string().cuid('Invalid sector ID'),
  campaignId: z.string().cuid('Invalid campaign ID').optional(),
  products: z.array(z.string().cuid()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.string().cuid('Invalid category ID'),
});

export const updateProductSchema = createProductSchema.partial();

// Product Category validation schemas
export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().max(1000).optional(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

// Sector validation schemas
export const createSectorSchema = z.object({
  name: z.string().min(1, 'Sector name is required').max(255),
});

export const updateSectorSchema = createSectorSchema.partial();

// Settings validation schemas
export const createSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required').max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Setting key can only contain letters, numbers, underscores, and hyphens'),
  value: z.string().min(1, 'Setting value is required'),
});

export const updateSettingSchema = createSettingSchema.partial();

// Permission validation schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Permission name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string().max(500).optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
