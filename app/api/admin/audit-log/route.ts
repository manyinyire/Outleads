import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndRole } from '@/lib/auth/auth'
import { AuditLogger } from '@/lib/utils/logging/audit-logger'

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const filters = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    }

    const logs = await AuditLogger.getAuditLogs(filters)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error)
    return NextResponse.json({ message: 'Failed to retrieve audit logs' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN', 'INFOSEC'], handler)
