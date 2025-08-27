import { withAuthAndRole } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().transform(val => val ?? undefined).optional(),
});

const handlers = createCrudHandlers({
  modelName: 'productCategory',
  entityName: 'Product Category',
  createSchema: categorySchema,
  updateSchema: categorySchema.partial(),
});

export const GET = withAuthAndRole(['ADMIN'], handlers.GET_BY_ID);
export const PUT = withAuthAndRole(['ADMIN'], handlers.PUT);
export const DELETE = withAuthAndRole(['ADMIN'], handlers.DELETE);
