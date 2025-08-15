import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRole, AuthenticatedRequest } from '@/lib/auth';

async function getProducts(req: AuthenticatedRequest) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const products = await prisma.product.findMany({
      include: {
        parent: true,
        subProducts: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch products' 
    }, { status: 500 });
  }
}

async function createProduct(req: AuthenticatedRequest) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { name, description, parentId } = await req.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Product name is required' 
      }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to create product' 
    }, { status: 500 });
  }
}

export const GET = withAuth(getProducts);
export const POST = withAuth(createProduct);