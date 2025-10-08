import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { withAuthAndRole } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, validateRequestBody } from '@/lib/api/api-utils';

const approveUserSchema = z.object({
  userId: z.string(),
});

const approveUser = withErrorHandler(async (req: Request) => {
  const validation = await validateRequestBody(req, approveUserSchema);
  if (!validation.success) return validation.error;

  const { userId } = validation.data;

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' },
  });

  return successResponse({ message: 'User approved successfully.' });
})

export const POST = withAuthAndRole(['ADMIN'], approveUser);
