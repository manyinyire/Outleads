import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { validateData, createCampaignSchema } from '@/lib/validation';
import { generateCampaignLink } from '@/lib/auth-utils';

// GET /api/admin/campaigns - Retrieve all campaigns
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            leads: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      campaigns
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch campaigns'
    }, { status: 500 });
  }
});

// POST /api/admin/campaigns - Create a new campaign
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    
    // Validate request data
    const validation = validateData(createCampaignSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: validation.error
      }, { status: 400 });
    }

    const { name, companyName } = validation.data;
    const userId = req.user!.id;

    // Generate unique campaign link
    let uniqueLink: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      uniqueLink = generateCampaignLink();
      const existing = await prisma.campaign.findUnique({
        where: { uniqueLink }
      });
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to generate unique campaign link'
      }, { status: 500 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        companyName,
        uniqueLink: uniqueLink!,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            leads: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to create campaign'
    }, { status: 500 });
  }
});