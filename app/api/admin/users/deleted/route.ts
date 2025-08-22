import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndRole } from '@/lib/auth'

async function handler() {
  try {
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
    })
    return NextResponse.json(deletedUsers)
  } catch (error) {
    console.error('Error fetching deleted users:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN', 'BSS'], handler)
