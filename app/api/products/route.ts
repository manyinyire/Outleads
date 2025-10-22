import { prisma } from '@/lib/db/prisma';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api/api-utils';

export const runtime = 'nodejs';

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

  return successResponse(productCategories);
});

export { handler as GET };
