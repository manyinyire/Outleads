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
      case 'pool-performance':
        data = await getPoolPerformance(startDate, endDate)
        break;
      case 'pool-agent-breakdown':
        data = await getPoolAgentBreakdown(startDate, endDate)
        break;
      case 'campaign-agent-breakdown':
        data = await getCampaignAgentBreakdown(startDate, endDate)
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
    include: {
      leads: {
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return campaigns.map((campaign: any) => {
    const leads = campaign.leads;
    const totalLeads = leads.length;

    // Called = leads with lastCalledAt set
    const calledLeads = leads.filter((l: any) => l.lastCalledAt !== null).length;

    // Not Called = leads never called
    const notCalledLeads = totalLeads - calledLeads;

    // Contacted = leads with firstLevelDisposition 'Contacted'
    const contactedLeads = leads.filter((l: any) =>
      l.firstLevelDisposition?.name === 'Contacted'
    ).length;

    // Not Contacted = leads with firstLevelDisposition 'Not Contacted'
    const notContactedLeads = leads.filter((l: any) =>
      l.firstLevelDisposition?.name === 'Not Contacted'
    ).length;

    // Sales = leads with secondLevelDisposition 'Sale'
    const salesLeads = leads.filter((l: any) =>
      l.secondLevelDisposition?.name === 'Sale'
    ).length;

    // Calling Rate = Called / Total Leads
    const callingRate = totalLeads > 0 ? (calledLeads / totalLeads) * 100 : 0;

    // Answer Rate = Contacted / Called
    const answerRate = calledLeads > 0 ? (contactedLeads / calledLeads) * 100 : 0;

    // Conversion Rate = Sales / Contacted
    const conversionRate = contactedLeads > 0 ? (salesLeads / contactedLeads) * 100 : 0;

    // Assigned agent name(s)
    const assignedAgent = campaign.assignedTo?.name || 'Unassigned';

    return {
      id: campaign.id,
      campaign_name: campaign.campaign_name,
      is_active: campaign.is_active,
      assigned_agent: assignedAgent,
      total_leads: totalLeads,
      called_leads: calledLeads,
      not_called_leads: notCalledLeads,
      contacted_leads: contactedLeads,
      not_contacted_leads: notContactedLeads,
      sales_leads: salesLeads,
      calling_rate: parseFloat(callingRate.toFixed(2)),
      answer_rate: parseFloat(answerRate.toFixed(2)),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      created_at: campaign.createdAt.toISOString(),
    };
  });
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
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT', status: 'ACTIVE' },
    include: {
      assignedLeads: {
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return agents.map((agent: any) => {
    // All leads directly assigned to this agent (campaign leads + pool leads)
    const allLeads = agent.assignedLeads;

    const totalLeads = allLeads.length;

    // Pool leads = leads that came via a lead pool
    const poolLeads = allLeads.filter((l: any) => l.leadPoolId !== null).length;

    // Campaign leads = leads directly from a campaign (no pool)
    const campaignLeads = allLeads.filter((l: any) => l.leadPoolId === null).length;

    // Called leads = leads with lastCalledAt set, optionally filtered by date range
    const calledLeads = allLeads.filter((lead: any) => {
      if (!lead.lastCalledAt) return false;
      const callDate = new Date(lead.lastCalledAt);
      if (startDate && callDate < new Date(startDate)) return false;
      if (endDate && callDate > new Date(endDate)) return false;
      return true;
    });
    const totalCalls = calledLeads.length;

    // Pending = not yet called
    const pendingCalls = allLeads.filter((lead: any) => !lead.lastCalledAt).length;

    // Connected = disposed as 'Contacted'
    const connectedCalls = calledLeads.filter((lead: any) =>
      lead.firstLevelDisposition?.name === 'Contacted'
    ).length;

    // Not Contacted = disposed as 'Not Contacted'
    const notContactedCalls = calledLeads.filter((lead: any) =>
      lead.firstLevelDisposition?.name === 'Not Contacted'
    ).length;

    // Sales = second level disposition 'Sale'
    const salesLeads = calledLeads.filter((lead: any) =>
      lead.secondLevelDisposition?.name === 'Sale'
    ).length;

    const callingRate = totalLeads > 0 ? (totalCalls / totalLeads) * 100 : 0;
    const answerRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;
    const conversionRate = connectedCalls > 0 ? (salesLeads / connectedCalls) * 100 : 0;

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_email: agent.email,
      total_leads: totalLeads,
      campaign_leads: campaignLeads,
      pool_leads: poolLeads,
      called_leads: totalCalls,
      not_called_leads: pendingCalls,
      contacted_leads: connectedCalls,
      not_contacted_leads: notContactedCalls,
      sales_leads: salesLeads,
      calling_rate: parseFloat(callingRate.toFixed(2)),
      answer_rate: parseFloat(answerRate.toFixed(2)),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
    };
  });
}

// ── Pool Performance Report ──────────────────────────────────────────────────
async function getPoolPerformance(startDate: string | null, endDate: string | null) {
  const whereClause: any = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const pools = await prisma.leadPool.findMany({
    where: whereClause,
    include: {
      campaign: { select: { id: true, campaign_name: true } },
      createdBy: { select: { id: true, name: true } },
      leads: {
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return pools.map((pool: any) => {
    const leads = pool.leads;
    const total = leads.length;
    const assigned = leads.filter((l: any) => l.assignedToId !== null).length;
    const unassigned = total - assigned;
    const called = leads.filter((l: any) => l.lastCalledAt !== null).length;
    const contacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Contacted').length;
    const notContacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Not Contacted').length;
    const sales = leads.filter((l: any) => l.secondLevelDisposition?.name === 'Sale').length;
    const disposed = leads.filter((l: any) => l.firstLevelDispositionId !== null).length;
    const pending = total - disposed;

    const uniqueAgents = new Set(leads.filter((l: any) => l.assignedToId).map((l: any) => l.assignedToId));

    const callingRate = assigned > 0 ? (called / assigned) * 100 : 0;
    const answerRate = called > 0 ? (contacted / called) * 100 : 0;
    const conversionRate = contacted > 0 ? (sales / contacted) * 100 : 0;

    return {
      id: pool.id,
      pool_name: pool.name,
      campaign_name: pool.campaign?.campaign_name || 'N/A',
      created_by: pool.createdBy?.name || 'N/A',
      agents_count: uniqueAgents.size,
      total_leads: total,
      assigned_leads: assigned,
      unassigned_leads: unassigned,
      called_leads: called,
      contacted_leads: contacted,
      not_contacted_leads: notContacted,
      pending_disposition: pending,
      sales_leads: sales,
      calling_rate: parseFloat(callingRate.toFixed(2)),
      answer_rate: parseFloat(answerRate.toFixed(2)),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      created_at: pool.createdAt.toISOString(),
    };
  });
}

// ── Pool Agent Breakdown Report ──────────────────────────────────────────────
async function getPoolAgentBreakdown(startDate: string | null, endDate: string | null) {
  const whereClause: any = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const pools = await prisma.leadPool.findMany({
    where: whereClause,
    include: {
      campaign: { select: { campaign_name: true } },
      leads: {
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows: any[] = [];

  for (const pool of pools as any[]) {
    // Group leads by agent
    const agentMap = new Map<string, { name: string; leads: any[] }>();

    for (const lead of pool.leads) {
      if (!lead.assignedToId) continue;
      if (!agentMap.has(lead.assignedToId)) {
        agentMap.set(lead.assignedToId, { name: lead.assignedTo?.name || 'Unknown', leads: [] });
      }
      agentMap.get(lead.assignedToId)!.leads.push(lead);
    }

    for (const [agentId, { name, leads }] of agentMap.entries()) {
      const total = leads.length;
      const called = leads.filter((l: any) => l.lastCalledAt !== null).length;
      const contacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Contacted').length;
      const notContacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Not Contacted').length;
      const sales = leads.filter((l: any) => l.secondLevelDisposition?.name === 'Sale').length;
      const pending = leads.filter((l: any) => l.firstLevelDispositionId === null).length;

      const callingRate = total > 0 ? (called / total) * 100 : 0;
      const answerRate = called > 0 ? (contacted / called) * 100 : 0;
      const conversionRate = contacted > 0 ? (sales / contacted) * 100 : 0;

      rows.push({
        id: `${pool.id}-${agentId}`,
        pool_name: pool.name,
        campaign_name: pool.campaign?.campaign_name || 'N/A',
        agent_name: name,
        total_leads: total,
        called_leads: called,
        not_called_leads: total - called,
        contacted_leads: contacted,
        not_contacted_leads: notContacted,
        pending_disposition: pending,
        sales_leads: sales,
        calling_rate: parseFloat(callingRate.toFixed(2)),
        answer_rate: parseFloat(answerRate.toFixed(2)),
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
      });
    }
  }

  return rows;
}

// ── Campaign Agent Breakdown Report ─────────────────────────────────────────
async function getCampaignAgentBreakdown(startDate: string | null, endDate: string | null) {
  const whereClause: any = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    include: {
      leads: {
        include: {
          firstLevelDisposition: true,
          secondLevelDisposition: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows: any[] = [];

  for (const campaign of campaigns as any[]) {
    // Group leads by agent
    const agentMap = new Map<string, { name: string; leads: any[] }>();

    for (const lead of campaign.leads) {
      if (!lead.assignedToId) continue;
      if (!agentMap.has(lead.assignedToId)) {
        agentMap.set(lead.assignedToId, { name: lead.assignedTo?.name || 'Unknown', leads: [] });
      }
      agentMap.get(lead.assignedToId)!.leads.push(lead);
    }

    for (const [agentId, { name, leads }] of agentMap.entries()) {
      const total = leads.length;
      const called = leads.filter((l: any) => l.lastCalledAt !== null).length;
      const contacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Contacted').length;
      const notContacted = leads.filter((l: any) => l.firstLevelDisposition?.name === 'Not Contacted').length;
      const sales = leads.filter((l: any) => l.secondLevelDisposition?.name === 'Sale').length;
      const pending = leads.filter((l: any) => l.firstLevelDispositionId === null).length;
      const poolLeads = leads.filter((l: any) => l.leadPoolId !== null).length;
      const directLeads = total - poolLeads;

      const callingRate = total > 0 ? (called / total) * 100 : 0;
      const answerRate = called > 0 ? (contacted / called) * 100 : 0;
      const conversionRate = contacted > 0 ? (sales / contacted) * 100 : 0;

      rows.push({
        id: `${campaign.id}-${agentId}`,
        campaign_name: campaign.campaign_name,
        agent_name: name,
        total_leads: total,
        direct_leads: directLeads,
        pool_leads: poolLeads,
        called_leads: called,
        not_called_leads: total - called,
        contacted_leads: contacted,
        not_contacted_leads: notContacted,
        pending_disposition: pending,
        sales_leads: sales,
        calling_rate: parseFloat(callingRate.toFixed(2)),
        answer_rate: parseFloat(answerRate.toFixed(2)),
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
      });
    }
  }

  return rows;
}
