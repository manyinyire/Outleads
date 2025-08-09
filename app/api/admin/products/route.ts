import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function getProducts(req: any) {
  try {
    const products = await prisma.product.findMany({
      include: {
        sector: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

async function createProduct(req: any) {
  try {
    const { name, description, price, sectorId } = await req.json();

    if (!name || !price || !sectorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        sector: {
          connect: { id: sectorId },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export const GET = withAuth(getProducts as any);
export const POST = withAuth(createProduct as any);