import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

export const runtime = 'nodejs';

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;

    // SBU-based visibility: limit AGENT/SUPERVISOR to their SBU's products' leads
    const role = req.user?.role;
    const sbuId = (req.user as any)?.sbu?.id || (req.user as any)?.sbuId;
    if (sbuId && (role === 'AGENT' || role === 'SUPERVISOR')) {
      // Leads where ANY linked product belongs to the user's SBU
      where.products = {
        some: {
          sbus: {
            some: { sbuId }
          }
        }
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });

    // Transform the data to match frontend expectations
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

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error('Admin leads API error:', error);
    return NextResponse.json({ 
      error: 'Something went wrong',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(handler as any);