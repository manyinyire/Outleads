import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: any;
}

export async function GET(req: Request, { params }: { params: { reportType: string } }) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured in .env file');
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data;
    switch (params.reportType) {
      case 'lead-details':
        data = await getLeadDetails(startDate, endDate)
        break;
      case 'campaign-performance':
        data = await getCampaignPerformance(startDate, endDate)
        break;
      case 'user-activity':
        data = await getUserActivity(startDate, endDate)
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error(`Error generating report:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function getLeadDetails(startDate: string | null, endDate: string | null) {
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      createdAt: true,
      businessSector: {
        select: { name: true },
      },
      campaign: {
        select: { campaign_name: true },
      },
      products: {
        select: { name: true },
      },
    },
  })

  return leads.map(lead => ({
    id: lead.id,
    full_name: lead.fullName,
    phone_number: lead.phoneNumber,
    business_sector: lead.businessSector.name,
    campaign: lead.campaign?.campaign_name || 'N/A',
    products: lead.products.map(p => p.name).join(', '),
    created_at: lead.createdAt.toISOString(),
  }))
}

async function getCampaignPerformance(startDate: string | null, endDate: string | null) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    select: {
      id: true,
      campaign_name: true,
      is_active: true,
      click_count: true,
      createdAt: true,
      _count: {
        select: { leads: true },
      },
    },
  })

  return campaigns.map(campaign => ({
    id: campaign.id,
    campaign_name: campaign.campaign_name,
    is_active: campaign.is_active,
    click_count: campaign.click_count,
    lead_count: campaign._count.leads,
    created_at: campaign.createdAt.toISOString(),
  }))
}

async function getUserActivity(startDate: string | null, endDate: string | null) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLogin: true,
      _count: {
        select: { campaigns: true },
      },
    },
  })

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    last_login: user.lastLogin?.toISOString() || 'N/A',
    campaigns_created: user._count.campaigns,
  }))
}
