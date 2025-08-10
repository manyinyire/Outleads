import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sbus = await prisma.sbu.findMany();
    return NextResponse.json(sbus);
  } catch (error) {
    console.error('Error fetching SBUs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch SBUs' },
      { status: 500 }
    );
  }
}