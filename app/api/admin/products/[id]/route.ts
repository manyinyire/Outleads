import { withAuthAndRole } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
});

const handlers = createCrudHandlers({
  modelName: 'product',
  entityName: 'Product',
  updateSchema: productSchema,
});

export const PUT = withAuthAndRole(['ADMIN'], handlers.PUT);
export const DELETE = withAuthAndRole(['ADMIN'], handlers.DELETE);