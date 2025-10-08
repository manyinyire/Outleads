import { prisma } from '@/lib/db/prisma';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api/api-utils';

const handler = withErrorHandler(async () => {
  const sectors = await prisma.sector.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return successResponse(sectors);
});

export { handler as GET };