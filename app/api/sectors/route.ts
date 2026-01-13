import { prisma } from '@/lib/db/prisma';
import { withErrorHandler, successResponse } from '@/lib/api/api-utils';

export const runtime = 'nodejs';
// Cache for 5 minutes (sectors rarely change)
export const revalidate = 300;

const handler = withErrorHandler(async () => {
  const sectors = await prisma.sector.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  const response = successResponse(sectors);
  
  // Add cache headers
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  return response;
});

export { handler as GET };