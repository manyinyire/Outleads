import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthAndRole } from '@/lib/auth'

async function handler() {
  try {
    // Since there's no deletedAt field in the User model, return empty array
    // or implement soft delete by adding deletedAt field to schema
    const deletedUsers: any[] = []
    return NextResponse.json(deletedUsers)
  } catch (error) {
    console.error('Error fetching deleted users:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN', 'BSS'], handler)
