import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });

    // Transform the data to match frontend expectations (same as in the auth endpoint)
    const transformedLeads = leads.map((lead: any) => ({
      id: lead.id,
      name: lead.fullName, // Map fullName to name
      email: lead.email || 'N/A',
      phone: lead.phoneNumber, // Map phoneNumber to phone
      company: lead.businessSector?.name || 'N/A', // Use sector as company
      products: lead.products || [],
      campaign: lead.campaign,
      status: lead.status, // Include status field
      createdAt: lead.createdAt,
    }));

    return NextResponse.json({
      originalCount: leads.length,
      transformedCount: transformedLeads.length,
      originalSample: leads[0] || null,
      transformedSample: transformedLeads[0] || null,
      allTransformed: transformedLeads,
    });
  } catch (error) {
    console.error('Debug leads test error:', error);
    return NextResponse.json({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}