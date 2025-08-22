import { withAuthAndRole } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';

const sectorSchema = z.object({
  name: z.string().min(1, 'Sector name is required'),
});

const handlers = createCrudHandlers({
  modelName: 'sector',
  entityName: 'Sector',
  createSchema: sectorSchema,
  updateSchema: sectorSchema.partial(),
});

export const GET = withAuthAndRole(['ADMIN'], handlers.GET_BY_ID);
export const PUT = withAuthAndRole(['ADMIN'], handlers.PUT);
export const DELETE = withAuthAndRole(['ADMIN'], handlers.DELETE);