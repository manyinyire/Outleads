import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth'
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api/api-utils'

const handler = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { reportType: string } }) => {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let data: any[] = [];
  
  try {
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
      case 'agent-performance':
        data = await getAgentPerformance(startDate, endDate)
        break;
      default:
        return errorResponse('Invalid report type', 400)
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return errorResponse('Failed to generate report', 500)
  }

  return successResponse({ data: data || [] })
})

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], handler);

async function getLeadDetails(startDate: string | null, endDate: string | null) {
  const whereClause: any = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
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
    orderBy: { createdAt: 'desc' },
  })

  return leads.map(lead => ({
    id: lead.id,
    full_name: lead.fullName,
    phone_number: lead.phoneNumber,
    business_sector: lead.businessSector?.name || 'N/A',
    campaign: lead.campaign?.campaign_name || 'N/A',
    products: lead.products.map(p => p.name).join(', ') || 'N/A',
    created_at: lead.createdAt.toISOString(),
  }))
}

async function getCampaignPerformance(startDate: string | null, endDate: string | null) {
  const whereClause: any = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
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
    orderBy: { createdAt: 'desc' },
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
  const whereClause: any = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const users = await prisma.user.findMany({
    where: whereClause,
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
    orderBy: { createdAt: 'desc' },
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

async function getAgentPerformance(startDate: string | null, endDate: string | null) {
  const whereClause: any = {
    role: 'AGENT',
    status: 'ACTIVE'
  };

  const agents = await prisma.user.findMany({
    where: whereClause,
    include: {
      assignedCampaigns: {
        include: {
          leads: {
            include: {
              firstLevelDisposition: true,
              secondLevelDisposition: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return agents.map((agent: any) => {
    // Get all leads from assigned campaigns
    const allCampaignLeads = agent.assignedCampaigns.flatMap((campaign: any) => campaign.leads);
    
    // Filter leads that were called by this agent in the date range
    const leadsInDateRange = allCampaignLeads.filter((lead: any) => {
      // Must have been called (has lastCalledAt)
      if (!lead.lastCalledAt) return false;
      
      const callDate = new Date(lead.lastCalledAt);
      
      // Check date range if specified
      if (startDate && callDate < new Date(startDate)) return false;
      if (endDate && callDate > new Date(endDate)) return false;
      
      return true;
    });
    
    // Use the filtered leads for calculations
    const allLeads = leadsInDateRange;
    
    const totalLeads = allLeads.length;
    const calledLeads = allLeads.filter((lead: any) => lead.lastCalledAt !== null).length;
    const notCalledLeads = totalLeads - calledLeads;
    const contactedLeads = allLeads.filter((lead: any) => lead.firstLevelDisposition?.name === 'Contacted').length;
    const notContactedLeads = allLeads.filter((lead: any) => lead.firstLevelDisposition?.name === 'Not Contacted').length;
    const salesLeads = allLeads.filter((lead: any) => lead.secondLevelDisposition?.name === 'Sale').length;
    
    // Calling Rate = (Total Calls / Total Leads) * 100
    const callingRate = totalLeads > 0 ? (calledLeads / totalLeads) * 100 : 0;
    
    // Answer Rate = (Connected Calls / Total Calls) * 100
    // This shows what percentage of calls were actually answered/connected
    const answerRate = calledLeads > 0 ? (contactedLeads / calledLeads) * 100 : 0;
    
    // Conversion Rate = (Sales / Connected Calls) * 100
    const conversionRate = contactedLeads > 0 ? (salesLeads / contactedLeads) * 100 : 0;

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_email: agent.email,
      total_leads: totalLeads,
      called_leads: calledLeads,
      not_called_leads: notCalledLeads,
      contacted_leads: contactedLeads,
      not_contacted_leads: notContactedLeads,
      sales_leads: salesLeads,
      calling_rate: parseFloat(callingRate.toFixed(2)),
      answer_rate: parseFloat(answerRate.toFixed(2)),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      campaigns_count: agent.assignedCampaigns.length
    };
  });
}
