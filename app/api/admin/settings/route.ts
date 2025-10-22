import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth'
import { withErrorHandler, successResponse } from '@/lib/api/api-utils'
import { logger } from '@/lib/utils/logging'

export const runtime = 'nodejs';

const handler = withErrorHandler(async (req: AuthenticatedRequest) => {
  const settings = await prisma.setting.findMany()
  return successResponse(settings)
})

const postHandler = withErrorHandler(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const { key, value } = body

  const updatedSetting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  logger.info('Setting updated', { key, userId: req.user?.id })
  return successResponse(updatedSetting)
})

export const GET = withAuthAndRole(['ADMIN'], handler);
export const POST = withAuthAndRole(['ADMIN'], postHandler);
