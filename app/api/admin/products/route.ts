import { withAuthAndRole } from '@/lib/auth/auth';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
});

const handlers = createCrudHandlers({
  modelName: 'product',
  entityName: 'Product',
  createSchema: productSchema,
  updateSchema: productSchema,
  orderBy: { name: 'asc' },
  includeRelations: {
    category: true,
  },
  afterCreate: async () => {
    // Revalidate homepage to show new product in form
    revalidatePath('/');
  },
});

export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'SUPERVISOR'], handlers.GET);
export const POST = withAuthAndRole(['ADMIN'], handlers.POST);