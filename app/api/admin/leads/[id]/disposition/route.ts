import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const dispositionSchema = z.object({
  firstLevelDispositionId: z.string().cuid('Invalid disposition ID'),
  secondLevelDispositionId: z.string().cuid('Invalid disposition ID').optional(),
  thirdLevelDispositionId: z.string().cuid('Invalid disposition ID').optional(),
  dispositionNotes: z.string().optional(),
});

// PUT - Update lead disposition
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], async (authReq: AuthenticatedRequest) => {
    try {
      const leadId = params.id;
      const body = await req.json();
      
      const validation = dispositionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const { firstLevelDispositionId, secondLevelDispositionId, thirdLevelDispositionId, dispositionNotes } = validation.data;

      // Check if lead exists
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Lead not found'
        }, { status: 404 });
      }

      // Verify dispositions exist
      const firstLevel = await prisma.firstLevelDisposition.findUnique({
        where: { id: firstLevelDispositionId }
      });

      if (!firstLevel) {
        return NextResponse.json({
          error: 'Invalid Disposition',
          message: 'First level disposition not found'
        }, { status: 400 });
      }

      // Update lead with disposition
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          firstLevelDispositionId,
          secondLevelDispositionId: secondLevelDispositionId || null,
          thirdLevelDispositionId: thirdLevelDispositionId || null,
          dispositionNotes: dispositionNotes || null,
          lastCalledAt: new Date(),
        },
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
          thirdLevelDisposition: true,
          businessSector: true,
          products: true,
          campaign: true,
          assignedTo: true
        }
      });

      return NextResponse.json({
        message: 'Lead disposition updated successfully',
        lead: updatedLead
      }, { status: 200 });

    } catch (error) {
      console.error('Error updating lead disposition:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to update lead disposition'
      }, { status: 500 });
    }
  })(req);
}
