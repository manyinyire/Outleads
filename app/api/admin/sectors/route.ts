import { withAuthAndRole } from '@/lib/auth';
import { createGetHandler } from '@/lib/crud-factory';

const handlers = {
  GET: createGetHandler({
    modelName: 'sector',
    entityName: 'Sector',
    orderBy: { name: 'asc' },
  }),
};

export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'SUPERVISOR'], handlers.GET);
