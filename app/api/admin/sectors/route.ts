import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRole, AuthenticatedRequest } from '@/lib/auth';

async function getSectors(req: AuthenticatedRequest) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const sectors = await prisma.sector.findMany({
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

async function createSector(req: AuthenticatedRequest) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Sector name is required' 
      }, { status: 400 });
    }

    const sector = await prisma.sector.create({
      data: {
        name,
      },
    });

    return NextResponse.json(sector, { status: 201 });
  } catch (error) {
    console.error('Error creating sector:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to create sector' 
    }, { status: 500 });
  }
}

export const GET = withAuth(getSectors);
export const POST = withAuth(createSector);
