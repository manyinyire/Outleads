import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, validateRequestBody } from '@/lib/api/api-utils';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const getProductCategories = withErrorHandler(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  const where = search
    ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }
    : {};

  const productCategories = await prisma.productCategory.findMany({
    where,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
  return successResponse({ data: productCategories });
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
