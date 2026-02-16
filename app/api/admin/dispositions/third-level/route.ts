import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const dispositionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['no_sale', 'not_contacted']),
  isActive: z.boolean().optional(),
});

// GET - List all third level dispositions
export async function GET(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], async () => {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category');

      const where = category ? { category } : {};

      const dispositions = await prisma.thirdLevelDisposition.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      return NextResponse.json({
        data: dispositions,
        total: dispositions.length
      });
    } catch (error) {
      console.error('Error fetching third level dispositions:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch dispositions'
      }, { status: 500 });
    }
  })(req);
}

// POST - Create new third level disposition (ADMIN only)
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

      const disposition = await prisma.thirdLevelDisposition.create({
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
          message: 'A disposition with this name and category already exists'
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
