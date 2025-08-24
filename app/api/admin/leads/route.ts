import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { createCrudHandlers } from '@/lib/crud-factory';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, withErrorHandler, extractPaginationParams, calculatePaginationMeta } from '@/lib/api-utils';

const leadSchema = z.object({
  fullName: z.string(),
  phoneNumber: z.string(),
});

const customGetHandler = withErrorHandler(async (req: AuthenticatedRequest) => {
  const url = (req as any).url || (req as any).nextUrl?.href || '';
  const { page, limit, sortBy, sortOrder } = extractPaginationParams(url);
  const skip = ((page || 1) - 1) * (limit || 10);
  
  const reqUrl = new URL(url);
  const searchQuery = reqUrl.searchParams.get('search');
  const productId = reqUrl.searchParams.get('productId');
  const campaignId = reqUrl.searchParams.get('campaignId');
  const sectorId = reqUrl.searchParams.get('sectorId');
  const startDate = reqUrl.searchParams.get('startDate');
  const endDate = reqUrl.searchParams.get('endDate');

  const queryConditions: any = { AND: [] };
  
  if (searchQuery) {
    queryConditions.OR = ['fullName', 'phoneNumber'].map(field => ({
      [field]: {
        contains: searchQuery,
        mode: 'insensitive'
      }
    }));
  }

  if (productId) {
    queryConditions.AND.push({ products: { some: { id: productId } } });
  }
  if (campaignId) {
    queryConditions.AND.push({ campaignId: campaignId });
  }
  if (sectorId) {
    queryConditions.AND.push({ sectorId: sectorId });
  }
  if (startDate && endDate) {
    queryConditions.AND.push({
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    });
  }

  if (queryConditions.AND.length === 0) {
    delete queryConditions.AND;
  }

  const [records, total] = await Promise.all([
    prisma.lead.findMany({
      where: queryConditions,
      skip,
      take: limit || 10,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      include: {
        businessSector: true,
        products: true,
        campaign: true, // This was the missing piece
      },
    }),
    prisma.lead.count({ where: queryConditions })
  ]);
  
  const meta = calculatePaginationMeta(total, page || 1, limit || 10);
  
  return successResponse({
    lead: records,
    meta
  });
});

// The handlers factory is not used for GET, but may be used for other methods.
const handlers = createCrudHandlers({
  modelName: 'lead',
  entityName: 'Lead',
  createSchema: leadSchema,
  updateSchema: leadSchema.partial(),
  orderBy: { createdAt: 'desc' },
  searchFields: ['fullName', 'phoneNumber'],
});

export const GET = withAuthAndRole(['ADMIN', 'AGENT', 'SUPERVISOR'], customGetHandler);
