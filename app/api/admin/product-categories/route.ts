import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';

const prisma = new PrismaClient();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const getProductCategories = async (req: AuthenticatedRequest) => {
  try {
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
    return NextResponse.json({ data: productCategories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

const createProductCategory = async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const newCategory = await prisma.productCategory.create({
      data: validation.data,
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export const GET = withAuthAndRole(['ADMIN'], getProductCategories);
export const POST = withAuthAndRole(['ADMIN'], createProductCategory);
