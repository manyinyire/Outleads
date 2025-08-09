import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function updateProduct(req: any, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, description, price, sectorId } = await req.json();

    if (!name || !price || !sectorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        sector: {
          connect: { id: sectorId },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

async function deleteProduct(req: any, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export const PUT = withAuth(updateProduct as any);
export const DELETE = withAuth(deleteProduct as any);