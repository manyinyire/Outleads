import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRole, AuthenticatedRequest } from '@/lib/auth';

export const runtime = 'nodejs';

async function updateProduct(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { id } = params;
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Product name is required' 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Not Found',
        message: 'Product not found' 
      }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to update product' 
    }, { status: 500 });
  }
}

async function deleteProduct(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { id } = params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Not Found',
        message: 'Product not found' 
      }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete product' 
    }, { status: 500 });
  }
}

export const PUT = withAuth(updateProduct);
export const DELETE = withAuth(deleteProduct);