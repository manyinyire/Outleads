import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, validateRequestBody, extractPaginationParams, calculatePaginationMeta } from '@/lib/api/api-utils';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const getProductCategories = withErrorHandler(async (req: AuthenticatedRequest) => {
  const url = (req as any).url || (req as any).nextUrl?.href || '';
  const { page, limit, sortBy, sortOrder } = extractPaginationParams(url);
  const skip = ((page || 1) - 1) * (limit || 10);
  
  const { searchParams } = new URL(url);
  const search = searchParams.get('search');

  const where = search
    ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }
    : {};

  const [productCategories, total] = await Promise.all([
    prisma.productCategory.findMany({
      where,
      skip,
      take: limit || 10,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
    prisma.productCategory.count({ where })
  ]);
  
  const meta = calculatePaginationMeta(total, page || 1, limit || 10);
  
  return successResponse({ data: productCategories, meta });
});

const createProductCategory = withErrorHandler(async (req: AuthenticatedRequest) => {
  const validation = await validateRequestBody(req as any, categorySchema);
  if (!validation.success) return validation.error;

  const newCategory = await prisma.productCategory.create({
    data: validation.data,
  });

  // Revalidate homepage to show new category in form
  revalidatePath('/');

  return successResponse(newCategory, 201);
});

export const GET = withAuthAndRole(['ADMIN'], getProductCategories);
export const POST = withAuthAndRole(['ADMIN'], createProductCategory);
