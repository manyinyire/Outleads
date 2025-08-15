import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leadCount = await prisma.lead.count();
    const campaignCount = await prisma.campaign.count();
    const productCount = await prisma.product.count();
    const sectorCount = await prisma.sector.count();
    
    // Get a sample lead if any exist
    const sampleLead = await prisma.lead.findFirst({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });
    
    return NextResponse.json({
      counts: {
        leads: leadCount,
        campaigns: campaignCount,
        products: productCount,
        sectors: sectorCount,
      },
      sampleLead,
    });
  } catch (error) {
    console.error('Debug leads count error:', error);
    return NextResponse.json({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}