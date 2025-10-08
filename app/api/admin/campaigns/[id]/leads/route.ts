import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateUserPermissions } from '@/lib/auth/auth-utils';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api/api-utils';

const handler = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const hasAccess = await validateUserPermissions(req, ['ADMIN', 'SUPERVISOR']);
  if (!hasAccess) {
    return errorResponse('Forbidden', 403);
  }

  const leads = await prisma.lead.findMany({
    where: {
      campaignId: params.id,
    },
    include: {
      businessSector: true, // Include the full sector object
      products: true,       // Include all related product objects
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse(leads);
});

export { handler as GET };
