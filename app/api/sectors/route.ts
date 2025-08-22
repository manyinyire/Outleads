import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';

const handler = withErrorHandler(async () => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return successResponse(sectors);
  } catch (error) {
    console.error('Failed to fetch sectors:', error);
    return errorResponse('An error occurred while fetching sectors.', 500);
  }
});

export { handler as GET };