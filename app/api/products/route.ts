import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Retrieve all products and sectors (public endpoint)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";

    const where: any = {
      parentId: null, // Fetch only top-level products
    };

    if (category) {
      where.category = category;
    }

    const [products, sectors] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          subProducts: {
            orderBy: {
              name: 'asc',
            },
            include: {
              subProducts: {
                orderBy: {
                  name: 'asc',
                },
              }, // Include grandchildren to support a 3-level hierarchy
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
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