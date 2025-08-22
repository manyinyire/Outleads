import { withAuthAndRole } from '@/lib/auth';
import { createGetHandler } from '@/lib/crud-factory';

const handlers = {
  GET: createGetHandler({
    modelName: 'product',
    entityName: 'Product',
    orderBy: { name: 'asc' },
  }),
};

export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'TEAMLEADER'], handlers.GET);