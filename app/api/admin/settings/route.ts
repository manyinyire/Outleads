import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth'

const prisma = new PrismaClient()

async function handler(req: AuthenticatedRequest) {
  try {
    const settings = await prisma.setting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { key, value } = body

    const updatedSetting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(updatedSetting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN'], handler);
export const POST = withAuthAndRole(['ADMIN'], postHandler);
