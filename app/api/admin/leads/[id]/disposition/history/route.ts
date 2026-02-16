import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

// GET - Fetch disposition history for a lead
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], async (authReq: AuthenticatedRequest) => {
    try {
      const leadId = params.id;

      // Check if lead exists
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { id: true }
      });

      if (!lead) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Lead not found'
        }, { status: 404 });
      }

      // Fetch disposition history
      const history = await prisma.dispositionHistory.findMany({
        where: { leadId },
        include: {
          firstLevelDisposition: {
            select: { name: true }
          },
          secondLevelDisposition: {
            select: { name: true }
          },
          thirdLevelDisposition: {
            select: { name: true, category: true }
          },
          changedBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: { changedAt: 'desc' }
      });

      return NextResponse.json({
        data: history,
        total: history.length
      }, { status: 200 });

    } catch (error) {
      console.error('Error fetching disposition history:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch disposition history'
      }, { status: 500 });
    }
  })(req);
}
