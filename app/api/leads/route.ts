import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateData, createLeadSchema } from '@/lib/validation';
import { isValidCampaignLink } from '@/lib/auth-utils';

// POST /api/leads - Create a new lead (public endpoint)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extract data from request body (campaignId can come from body or query params)
    const { name, email, phone, company, productIds, campaignId: bodyCampaignId } = body;
    const url = new URL(request.url);
    const queryCampaignId = url.searchParams.get('campaignId');
    const campaignId = bodyCampaignId || queryCampaignId;

    // Basic validation
    if (!name || !phone || !company || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Missing required fields: name, phone, company, and productIds'
      }, { status: 400 });
    }

    const fullName = name;
    const phoneNumber = phone;

    // Find sector by name (company field contains sector name)
    const sector = await prisma.sector.findFirst({
      where: { name: company }
    });

    if (!sector) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Invalid business sector'
      }, { status: 400 });
    }

    // Validate products exist
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'One or more product IDs are invalid'
      }, { status: 400 });
    }

    // Validate campaign if provided
    let validCampaignId = null;
    if (campaignId && typeof campaignId === 'string') {
      if (!isValidCampaignLink(campaignId)) {
        return NextResponse.json({
          error: 'Validation Error',
          message: 'Invalid campaign ID format'
        }, { status: 400 });
      }

      const campaign = await prisma.campaign.findUnique({
        where: { uniqueLink: campaignId }
      });

      if (!campaign) {
        return NextResponse.json({
          error: 'Validation Error',
          message: 'Campaign not found'
        }, { status: 400 });
      }

      validCampaignId = campaign.id;
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        fullName,
        phoneNumber,
        sectorId: sector.id,
        campaignId: validCampaignId || undefined,
        products: {
          connect: productIds.map((id: string) => ({ id }))
        }
      },
      include: {
        businessSector: {
          select: {
            id: true,
            name: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            companyName: true,
            uniqueLink: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Lead created successfully',
      lead
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to create lead'
    }, { status: 500 });
  }
}