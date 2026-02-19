import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { successResponse, withErrorHandler, extractPaginationParams, calculatePaginationMeta } from '@/lib/api/api-utils';

export const runtime = 'nodejs';

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
  const callStatus = reqUrl.searchParams.get('callStatus');
  const startDate = reqUrl.searchParams.get('startDate');
  const endDate = reqUrl.searchParams.get('endDate');

  const user = req.user;
  const queryConditions: any = { AND: [] };
  
  if (user?.role === 'AGENT') {
    queryConditions.AND.push({ assignedToId: user.id });
    queryConditions.AND.push({ firstLevelDispositionId: null });
  }

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
    if (campaignId === 'direct') {
      queryConditions.AND.push({ campaignId: null });
    } else {
      queryConditions.AND.push({ campaignId: campaignId });
    }
  }
  if (sectorId) {
    queryConditions.AND.push({ sectorId: sectorId });
  }
  if (callStatus) {
    if (callStatus === 'called') {
      queryConditions.AND.push({ lastCalledAt: { not: null } });
    } else if (callStatus === 'not_called') {
      queryConditions.AND.push({ lastCalledAt: null });
    }
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
        campaign: true,
        assignedTo: {
          select: {
            name: true,
          },
        },
        firstLevelDisposition: true,
        secondLevelDisposition: true,
        thirdLevelDisposition: true,
      },
    }),
    prisma.lead.count({ where: queryConditions })
  ]);
  
  const meta = calculatePaginationMeta(total, page || 1, limit || 10);
  
  return successResponse({
    data: records,
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
