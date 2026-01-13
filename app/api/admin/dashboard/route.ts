import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth'
import { withErrorHandler, successResponse } from '@/lib/api/api-utils'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = withErrorHandler(async (req: AuthenticatedRequest) => {
  // Use parallel queries with minimal data fetching
  const [totalLeads, activeCampaigns, recentLeads, campaignStats] = await Promise.all([
    // Total leads count
    prisma.lead.count(),
    
    // Active campaigns count
    prisma.campaign.count({ where: { is_active: true } }),
    
    // Last 90 days of leads for charts (only date and campaign)
    prisma.lead.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        createdAt: true,
        campaignId: true,
      },
    }),
    
    // Campaign performance using groupBy
    prisma.lead.groupBy({
      by: ['campaignId'],
      _count: {
        id: true
      },
      where: {
        campaignId: { not: null }
      }
    })
  ]);

  // Process data for charts (only recent data)
  const leadsPerDay = recentLeads.reduce((acc: Record<string, number>, lead: any) => {
    const date = new Date(lead.createdAt).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const leadsPerMonth = recentLeads.reduce((acc: Record<string, number>, lead: any) => {
    const month = new Date(lead.createdAt).toISOString().slice(0, 7)
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Fetch campaign names only for campaigns with leads
  const campaignIds = campaignStats.map(stat => stat.campaignId).filter(Boolean) as string[];
  const campaigns = campaignIds.length > 0 ? await prisma.campaign.findMany({
    where: { id: { in: campaignIds } },
    select: { id: true, campaign_name: true }
  }) : [];

  const campaignMap = new Map(campaigns.map(c => [c.id, c.campaign_name]));
  const campaignPerformance = campaignStats.map(stat => ({
    name: campaignMap.get(stat.campaignId!) || 'Unknown',
    value: stat._count.id
  }));

  return successResponse({
    totalLeads,
    activeCampaigns,
    leadsPerDay: Object.entries(leadsPerDay).map(([name, value]) => ({ name, value })),
    leadsPerMonth: Object.entries(leadsPerMonth).map(([name, value]) => ({ name, value })),
    campaignPerformance,
  })
})

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], handler);
