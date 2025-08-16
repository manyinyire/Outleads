import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRole, AuthenticatedRequest } from '@/lib/auth';

async function getProducts(req: AuthenticatedRequest) {
  try {
    // Check if user has ADMIN role
    const roleError = requireRole(['ADMIN'])(req.user!);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filter = searchParams.get("filter") || "";
    const category = searchParams.get("category") || "";

    const where: any = filter
      ? {
          OR: [
            { name: { contains: filter, mode: "insensitive" } },
            { description: { contains: filter, mode: "insensitive" } },
          ],
        }
      : {};

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        parent: true,
        subProducts: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalProducts = await prisma.product.count({ where });
    
    return NextResponse.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
    });
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

    const { name, description, parentId, category } = await req.json();

    if (!name || !category) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Product name and category are required' 
      }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
        category,
      },
      include: {
        parent: true,
        subProducts: true,
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