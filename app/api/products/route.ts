import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Retrieve all products and sectors (public endpoint)
export async function GET() {
  try {
    const [products, sectors] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          category: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.sector.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return NextResponse.json({
      products,
      sectors
    });

  } catch (error) {
    console.error('Error fetching products and sectors:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch products and sectors'
    }, { status: 500 });
  }
}