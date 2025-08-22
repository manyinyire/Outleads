import { withAuthAndRole } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const handlers = createCrudHandlers({
  modelName: 'productCategory',
  entityName: 'Product Category',
  createSchema: categorySchema,
  updateSchema: categorySchema.partial(),
  includeRelations: {
    products: true, // Include sub-products
    _count: {
      select: { products: true }
    }
  },
  orderBy: { name: 'asc' },
  searchFields: ['name'],
});

export const GET = withAuthAndRole(['ADMIN'], handlers.GET);
export const POST = withAuthAndRole(['ADMIN'], handlers.POST);
