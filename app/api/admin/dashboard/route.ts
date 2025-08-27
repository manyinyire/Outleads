import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic';

async function handler(req: AuthenticatedRequest) {
  try {

    const leads = await prisma.lead.findMany({
      select: {
        createdAt: true,
        campaignId: true,
        campaign: {
          select: {
            campaign_name: true,
          },
        },
      },
    })

    // Process data for charts
    const leadsPerDay = leads.reduce((acc: Record<string, number>, lead: any) => {
      const date = new Date(lead.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    const leadsPerMonth = leads.reduce((acc: Record<string, number>, lead: any) => {
      const month = new Date(lead.createdAt).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const campaignPerformance = leads.reduce((acc: Record<string, number>, lead: any) => {
      if (lead.campaign) {
        const name = lead.campaign.campaign_name
        acc[name] = (acc[name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const activeCampaigns = await prisma.campaign.count({
      where: { is_active: true },
    })

    const totalLeads = leads.length

    return NextResponse.json({
      totalLeads,
      activeCampaigns,
      leadsPerDay: Object.entries(leadsPerDay).map(([name, value]) => ({ name, value })),
      leadsPerMonth: Object.entries(leadsPerMonth).map(([name, value]) => ({ name, value })),
      campaignPerformance: Object.entries(campaignPerformance).map(([name, value]) => ({ name, value })),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], handler);
