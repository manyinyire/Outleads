import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sectors - Retrieve all sectors (public endpoint)
export async function GET() {
  try {
    const sectors = await prisma.sector.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(sectors);

  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch sectors'
    }, { status: 500 });
  }
}
