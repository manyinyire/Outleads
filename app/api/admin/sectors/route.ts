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
  updateSchema: sectorSchema,
  orderBy: { name: 'asc' },
});

export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'SUPERVISOR'], handlers.GET);
export const POST = withAuthAndRole(['ADMIN'], handlers.POST);