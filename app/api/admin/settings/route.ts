import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth'

const prisma = new PrismaClient()

const getSettingsHandler = async (req: AuthenticatedRequest) => {
  try {
    const settings = await prisma.setting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const postSettingsHandler = async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const updatedSetting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })

    return NextResponse.json(updatedSetting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN'], getSettingsHandler)
export const POST = withAuthAndRole(['ADMIN'], postSettingsHandler)
