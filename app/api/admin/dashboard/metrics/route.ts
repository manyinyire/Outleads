import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

// GET - Fetch dashboard metrics
export async function GET(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR'], async (authReq: AuthenticatedRequest) => {
    try {
      // Get date range from query params (default to last 30 days)
      const url = new URL(req.url);
      const days = parseInt(url.searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch all metrics in parallel
      const [
        totalLeads,
        calledLeads,
        contactedLeads,
        salesLeads,
        activeCampaigns,
        activeAgents,
        recentLeads,
        topAgents
      ] = await Promise.all([
        // Total leads
        prisma.lead.count(),
        
        // Called leads (have lastCalledAt)
        prisma.lead.count({
          where: { lastCalledAt: { not: null } }
        }),
        
        // Contacted leads
        prisma.lead.count({
          where: {
            firstLevelDisposition: { name: 'Contacted' }
          }
        }),
        
        // Sales
        prisma.lead.count({
          where: {
            secondLevelDisposition: { name: 'Sale' }
          }
        }),
        
        // Active campaigns
        prisma.campaign.count({
          where: { is_active: true }
        }),
        
        // Active agents
        prisma.user.count({
          where: {
            role: 'AGENT',
            status: 'ACTIVE'
          }
        }),
        
        // Recent leads (last 7 days)
        prisma.lead.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        
        // Top performing agents
        prisma.user.findMany({
          where: {
            role: 'AGENT',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                assignedLeads: {
                  where: {
                    secondLevelDisposition: { name: 'Sale' }
                  }
                }
              }
            }
          },
          orderBy: {
            assignedLeads: {
              _count: 'desc'
            }
          },
          take: 5
        })
      ]);

      // Calculate rates
      const callingRate = totalLeads > 0 ? (calledLeads / totalLeads) * 100 : 0;
      const answerRate = calledLeads > 0 ? (contactedLeads / calledLeads) * 100 : 0;
      const conversionRate = contactedLeads > 0 ? (salesLeads / contactedLeads) * 100 : 0;

      // Get daily stats for trend chart (last 7 days)
      const dailyStats = await Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const [calls, contacts, sales] = await Promise.all([
            prisma.lead.count({
              where: {
                lastCalledAt: {
                  gte: date,
                  lt: nextDate
                }
              }
            }),
            prisma.lead.count({
              where: {
                firstLevelDisposition: { name: 'Contacted' },
                updatedAt: {
                  gte: date,
                  lt: nextDate
                }
              }
            }),
            prisma.lead.count({
              where: {
                secondLevelDisposition: { name: 'Sale' },
                updatedAt: {
                  gte: date,
                  lt: nextDate
                }
              }
            })
          ]);

          return {
            date: date.toISOString().split('T')[0],
            calls,
            contacts,
            sales
          };
        })
      );

      return NextResponse.json({
        overview: {
          totalLeads,
          calledLeads,
          contactedLeads,
          salesLeads,
          activeCampaigns,
          activeAgents,
          recentLeads
        },
        rates: {
          callingRate: Math.round(callingRate * 10) / 10,
          answerRate: Math.round(answerRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10
        },
        topAgents: topAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          sales: agent._count.assignedLeads
        })),
        dailyStats
      }, { status: 200 });

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch dashboard metrics'
      }, { status: 500 });
    }
  })(req);
}
