import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateData, createLeadSchema } from '@/lib/validation';
import { isValidCampaignLink } from '@/lib/auth-utils';

// POST /api/leads - Create a new lead (public endpoint)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    // Validate request data
    const validation = validateData(createLeadSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: validation.error
      }, { status: 400 });
    }

    const { fullName, phoneNumber, sectorId, productIds } = validation.data;

    // Validate sector exists
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId }
    });

    if (!sector) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Invalid sector ID'
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
        sectorId,
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