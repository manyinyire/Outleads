import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { successResponse, extractPaginationParams, calculatePaginationMeta, withErrorHandler } from '@/lib/api/api-utils';

export const runtime = 'nodejs';

const getAuditLogs = withErrorHandler(async (req: AuthenticatedRequest) => {
  const url = (req as any).url || (req as any).nextUrl?.href || '';
  const { page, limit, sortBy, sortOrder } = extractPaginationParams(url);
  const skip = ((page || 1) - 1) * (limit || 10);
  
  const { searchParams } = new URL(url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const resourceType = searchParams.get('resourceType');
  const severity = searchParams.get('severity');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (resourceType) where.resourceType = resourceType;
  if (severity) where.severity = severity;
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit || 10,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where })
  ]);
  
  const meta = calculatePaginationMeta(total, page || 1, limit || 10);
  
  return successResponse({ data: logs, meta });
});

export const GET = withAuthAndRole(['ADMIN', 'INFOSEC'], getAuditLogs);
