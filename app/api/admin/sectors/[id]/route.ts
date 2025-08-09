import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRole, AuthenticatedRequest } from '@/lib/auth';

async function updateSector(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { id } = params;
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Sector name is required' 
      }, { status: 400 });
    }

    // Check if sector exists
    const existingSector = await prisma.sector.findUnique({
      where: { id }
    });

    if (!existingSector) {
      return NextResponse.json({ 
        error: 'Not Found',
        message: 'Sector not found' 
      }, { status: 404 });
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        name,
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.error('Error updating sector:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to update sector' 
    }, { status: 500 });
  }
}

async function deleteSector(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { id } = params;

    // Check if sector exists
    const existingSector = await prisma.sector.findUnique({
      where: { id },
      include: {
        leads: true
      }
    });

    if (!existingSector) {
      return NextResponse.json({ 
        error: 'Not Found',
        message: 'Sector not found' 
      }, { status: 404 });
    }

    // Check if sector has associated leads
    if (existingSector.leads.length > 0) {
      return NextResponse.json({ 
        error: 'Conflict',
        message: 'Cannot delete sector with associated leads' 
      }, { status: 409 });
    }

    await prisma.sector.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Sector deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting sector:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete sector' 
    }, { status: 500 });
  }
}

export const PUT = withAuth(updateSector);
export const DELETE = withAuth(deleteSector);
