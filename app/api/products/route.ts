import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';

const handler = withErrorHandler(async () => {
  try {
    const productCategories = await prisma.productCategory.findMany({
      include: {
        products: {
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse(productCategories);
  } catch (error) {
    console.error('Failed to fetch products for landing page:', error);
    return errorResponse('An error occurred while fetching products.', 500);
  }
});

export { handler as GET };
