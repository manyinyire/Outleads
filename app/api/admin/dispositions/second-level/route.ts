import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const dispositionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - List all second level dispositions
export async function GET(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], async () => {
    try {
      const dispositions = await prisma.secondLevelDisposition.findMany({
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({
        data: dispositions,
        total: dispositions.length
      });
    } catch (error) {
      console.error('Error fetching second level dispositions:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch dispositions'
      }, { status: 500 });
    }
  })(req);
}

// POST - Create new second level disposition (ADMIN only)
export async function POST(req: NextRequest) {
  return withAuthAndRole(['ADMIN'], async () => {
    try {
      const body = await req.json();
      const validation = dispositionSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const disposition = await prisma.secondLevelDisposition.create({
        data: validation.data,
      });

      return NextResponse.json({
        message: 'Disposition created successfully',
        data: disposition
      }, { status: 201 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: 'Duplicate',
          message: 'A disposition with this name already exists'
        }, { status: 409 });
      }
      console.error('Error creating disposition:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to create disposition'
      }, { status: 500 });
    }
  })(req);
}
