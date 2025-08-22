import { withAuthAndRole } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';

// Note: The create/update schemas are simplified for now
// as the primary goal is to get the data fetching to work.
const leadSchema = z.object({
  fullName: z.string(),
  phoneNumber: z.string(),
});

const handlers = createCrudHandlers({
  modelName: 'lead',
  entityName: 'Lead',
  createSchema: leadSchema,
  updateSchema: leadSchema.partial(),
  includeRelations: {
    businessSector: true,
    products: true,
    campaign: true,
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['fullName', 'phoneNumber'],
});

// Allow ADMIN, AGENT, and TEAMLEADER to view leads
export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'TEAMLEADER'], handlers.GET);
