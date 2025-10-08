import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole } from '@/lib/auth/auth';
import { withErrorHandler, successResponse } from '@/lib/api/api-utils';

const getPendingUsers = withErrorHandler(async () => {
  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
  return successResponse({ data: users });
})

export const GET = withAuthAndRole(['ADMIN'], getPendingUsers);
