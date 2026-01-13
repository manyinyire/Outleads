import { withAuthAndRole } from '@/lib/auth/auth';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().transform(val => val ?? undefined).optional(),
});

const handlers = createCrudHandlers({
  modelName: 'productCategory',
  entityName: 'Product Category',
  createSchema: categorySchema,
  updateSchema: categorySchema.partial(),
  afterUpdate: async () => {
    // Revalidate homepage to show updated category
    revalidatePath('/');
  },
  afterDelete: async () => {
    // Revalidate homepage to remove deleted category from form
    revalidatePath('/');
  },
});

export const GET = withAuthAndRole(['ADMIN'], handlers.GET_BY_ID);
export const PUT = withAuthAndRole(['ADMIN'], handlers.PUT);
export const DELETE = withAuthAndRole(['ADMIN'], handlers.DELETE);
