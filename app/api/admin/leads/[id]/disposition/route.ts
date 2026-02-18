import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const dispositionSchema = z.object({
  firstLevelDispositionId: z.string().cuid('Invalid disposition ID'),
  secondLevelDispositionId: z.string().cuid('Invalid disposition ID').optional().nullable(),
  thirdLevelDispositionId: z.string().cuid('Invalid disposition ID').optional().nullable(),
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
        console.error('Validation failed:', validation.error.errors);
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message,
          details: validation.error.errors
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

      // Verify dispositions exist and validate business rules
      const firstLevel = await prisma.firstLevelDisposition.findUnique({
        where: { id: firstLevelDispositionId },
        select: { id: true, name: true }
      });

      if (!firstLevel) {
        return NextResponse.json({
          error: 'Invalid Disposition',
          message: 'First level disposition not found'
        }, { status: 400 });
      }

      // Validation Rule 1: "Sale" or "No Sale" requires "Contacted" first level
      if (secondLevelDispositionId) {
        const secondLevel = await prisma.secondLevelDisposition.findUnique({
          where: { id: secondLevelDispositionId },
          select: { id: true, name: true }
        });

        if (!secondLevel) {
          return NextResponse.json({
            error: 'Invalid Disposition',
            message: 'Second level disposition not found'
          }, { status: 400 });
        }

        // Check if first level is "Contacted"
        if (firstLevel.name !== 'Contacted') {
          return NextResponse.json({
            error: 'Validation Error',
            message: 'Sale status can only be set when contact status is "Contacted"'
          }, { status: 400 });
        }
      }

      // Validation Rule 2: Third level requires second level
      if (thirdLevelDispositionId && !secondLevelDispositionId) {
        return NextResponse.json({
          error: 'Validation Error',
          message: 'Reason (Level 3) requires a sale status (Level 2) to be selected first'
        }, { status: 400 });
      }

      // Validation Rule 3: Verify third level disposition exists and matches category
      if (thirdLevelDispositionId) {
        const thirdLevel = await prisma.thirdLevelDisposition.findUnique({
          where: { id: thirdLevelDispositionId },
          select: { id: true, name: true, category: true }
        });

        if (!thirdLevel) {
          return NextResponse.json({
            error: 'Invalid Disposition',
            message: 'Third level disposition not found'
          }, { status: 400 });
        }

        // Verify category matches second level
        if (secondLevelDispositionId) {
          const secondLevel = await prisma.secondLevelDisposition.findUnique({
            where: { id: secondLevelDispositionId },
            select: { name: true }
          });

          const expectedCategory = secondLevel?.name === 'Sale' ? null : 
                                   secondLevel?.name === 'No Sale' ? 'no_sale' : 
                                   'not_contacted';

          if (secondLevel?.name === 'No Sale' && thirdLevel.category !== 'no_sale') {
            return NextResponse.json({
              error: 'Validation Error',
              message: 'Selected reason does not match "No Sale" category'
            }, { status: 400 });
          }
        }
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
