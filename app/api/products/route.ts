import { prisma } from '@/lib/db/prisma';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api/api-utils';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Cache for 5 minutes (products rarely change)
export const revalidate = 300;

const handler = withErrorHandler(async () => {
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

  const response = successResponse(productCategories);
  
  // Add cache headers
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  return response;
});

export { handler as GET };
