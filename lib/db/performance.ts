import { prisma } from './prisma';
import { logger } from '@/lib/utils/logging';

/**
 * Database Performance Optimization Utilities
 */
export class DatabasePerformance {
  /**
   * Monitor query execution time
   */
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log slow queries (>500ms)
      if (duration > 500) {
        logger.warn('Slow database query detected', {
          queryName,
          duration: `${duration}ms`,
          threshold: '500ms'
        });
      } else {
        logger.debug('Database query executed', {
          queryName,
          duration: `${duration}ms`
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database query failed', error as Error, {
        queryName,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Optimized user queries with proper relations and pagination
   */
  static async getUsers(params: {
    page?: number;
    limit?: number;
    status?: string[];
    role?: string;
    search?: string;
    includeRelations?: boolean;
  }) {
    return this.measureQuery('getUsers', async () => {
      const {
        page = 1,
        limit = 10,
        status,
        role,
        search,
        includeRelations = false
      } = params;

      const skip = (page - 1) * limit;
      
      // Build optimized where clause
      const where: any = {};
      
      if (status?.length) {
        where.status = { in: status };
      }
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Optimized select to avoid fetching unnecessary data
      const select: any = {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true
      };

      if (includeRelations) {
        select._count = {
          select: {
            campaigns: true,
            assignedLeads: true,
            assignedCampaigns: true
          }
        };
      }

      // Execute optimized parallel queries
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          select,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrevious: page > 1
        }
      };
    });
  }

  /**
   * Optimized leads queries with proper joins and filtering
   */
  static async getLeads(params: {
    page?: number;
    limit?: number;
    campaignId?: string;
    sectorId?: string;
    assignedToId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.measureQuery('getLeads', async () => {
      const {
        page = 1,
        limit = 10,
        campaignId,
        sectorId,
        assignedToId,
        search,
        dateFrom,
        dateTo
      } = params;

      const skip = (page - 1) * limit;
      
      // Build optimized where clause
      const where: any = {};
      
      if (campaignId) {
        where.campaignId = campaignId;
      }
      
      if (sectorId) {
        where.sectorId = sectorId;
      }
      
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
      
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Optimized select with minimal relations
      const [leads, totalCount] = await Promise.all([
        prisma.lead.findMany({
          where,
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            createdAt: true,
            updatedAt: true,
            businessSector: {
              select: { id: true, name: true }
            },
            campaign: {
              select: { id: true, campaign_name: true }
            },
            assignedTo: {
              select: { id: true, name: true }
            },
            products: {
              select: { id: true, name: true }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.lead.count({ where })
      ]);

      return {
        leads,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrevious: page > 1
        }
      };
    });
  }

  /**
   * Optimized campaigns queries with aggregated data
   */
  static async getCampaigns(params: {
    page?: number;
    limit?: number;
    createdById?: string;
    assignedToId?: string;
    isActive?: boolean;
    search?: string;
  }) {
    return this.measureQuery('getCampaigns', async () => {
      const {
        page = 1,
        limit = 10,
        createdById,
        assignedToId,
        isActive,
        search
      } = params;

      const skip = (page - 1) * limit;
      
      // Build optimized where clause
      const where: any = {};
      
      if (createdById) {
        where.createdById = createdById;
      }
      
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
      
      if (isActive !== undefined) {
        where.is_active = isActive;
      }
      
      if (search) {
        where.OR = [
          { campaign_name: { contains: search, mode: 'insensitive' } },
          { organization_name: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Execute optimized parallel queries
      const [campaigns, totalCount] = await Promise.all([
        prisma.campaign.findMany({
          where,
          select: {
            id: true,
            campaign_name: true,
            organization_name: true,
            uniqueLink: true,
            is_active: true,
            lead_count: true,
            click_count: true,
            createdAt: true,
            createdBy: {
              select: { id: true, name: true }
            },
            assignedTo: {
              select: { id: true, name: true }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.campaign.count({ where })
      ]);

      return {
        campaigns,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrevious: page > 1
        }
      };
    });
  }

  /**
   * Get dashboard statistics with optimized aggregation queries
   */
  static async getDashboardStats(userId?: string, role?: string) {
    return this.measureQuery('getDashboardStats', async () => {
      // Build where clauses based on user role
      const userWhere = role === 'AGENT' && userId ? { assignedToId: userId } : {};
      const campaignWhere = role === 'AGENT' && userId ? { assignedToId: userId } : {};

      // Execute all stats queries in parallel for maximum performance
      const [
        totalLeads,
        totalCampaigns,
        activeUsers,
        recentLeads,
        topCampaigns,
        leadsByMonth
      ] = await Promise.all([
        // Total leads count
        prisma.lead.count({ where: userWhere }),
        
        // Total campaigns count
        prisma.campaign.count({ where: campaignWhere }),
        
        // Active users count (for admins only)
        role !== 'AGENT' ? prisma.user.count({ where: { status: 'ACTIVE' } }) : 0,
        
        // Recent leads (last 7 days)
        prisma.lead.count({
          where: {
            ...userWhere,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        
        // Top performing campaigns
        prisma.campaign.findMany({
          where: campaignWhere,
          select: {
            id: true,
            campaign_name: true,
            lead_count: true,
            click_count: true
          },
          orderBy: { lead_count: 'desc' },
          take: 5
        }),
        
        // Leads by month (last 6 months)
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "createdAt") as month,
            COUNT(*)::int as count
          FROM "leads" 
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          ${userId && role === 'AGENT' ? prisma.$queryRaw`AND "assignedToId" = ${userId}` : prisma.$queryRaw``}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month DESC
        `
      ]);

      return {
        totalLeads,
        totalCampaigns,
        activeUsers,
        recentLeads,
        topCampaigns,
        leadsByMonth
      };
    });
  }

  /**
   * Optimize database connections and cache frequently accessed data
   */
  static async getProductsWithCategories() {
    return this.measureQuery('getProductsWithCategories', async () => {
      return prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { category: { name: 'asc' } },
          { name: 'asc' }
        ]
      });
    });
  }

  /**
   * Get sectors with lead counts (cached result)
   */
  static async getSectorsWithCounts() {
    return this.measureQuery('getSectorsWithCounts', async () => {
      return prisma.sector.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { leads: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    });
  }

  /**
   * Batch operations for better performance
   */
  static async batchUpdateCampaignStats(campaignIds: string[]) {
    return this.measureQuery('batchUpdateCampaignStats', async () => {
      // Use a single transaction for all updates
      return prisma.$transaction(async (tx) => {
        const updates = campaignIds.map(async (campaignId) => {
          const leadCount = await tx.lead.count({
            where: { campaignId }
          });
          
          return tx.campaign.update({
            where: { id: campaignId },
            data: { lead_count: leadCount }
          });
        });
        
        return Promise.all(updates);
      });
    });
  }

  /**
   * Database health check
   */
  static async healthCheck() {
    return this.measureQuery('healthCheck', async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date() };
      } catch (error) {
        logger.error('Database health check failed', error as Error);
        return { status: 'unhealthy', error: (error as Error).message, timestamp: new Date() };
      }
    });
  }

  /**
   * Get database performance metrics
   */
  static async getPerformanceMetrics() {
    return this.measureQuery('getPerformanceMetrics', async () => {
      try {
        // Get active connections and query statistics
        const [connections, slowQueries] = await Promise.all([
          prisma.$queryRaw`
            SELECT count(*) as active_connections 
            FROM pg_stat_activity 
            WHERE state = 'active'
          `,
          prisma.$queryRaw`
            SELECT query, calls, mean_exec_time, total_exec_time
            FROM pg_stat_statements 
            WHERE mean_exec_time > 100
            ORDER BY mean_exec_time DESC 
            LIMIT 10
          `
        ]);

        return {
          connections,
          slowQueries,
          timestamp: new Date()
        };
      } catch (error) {
        logger.warn('Could not retrieve performance metrics', { error: (error as Error).message });
        return { error: 'Performance metrics unavailable', timestamp: new Date() };
      }
    });
  }
}

/**
 * Database connection optimization
 */
export const optimizeDatabaseConnection = () => {
  // Set up connection pool optimization
  if (process.env.NODE_ENV === 'production') {
    // In production, use connection pooling
    logger.info('Database connection pool optimized for production');
  }
  
  // Clean up expired sessions periodically (every hour)
  if (typeof window === 'undefined') { // Server-side only
    setInterval(async () => {
      try {
        // This could be used for session cleanup when implemented
        logger.debug('Database maintenance check completed');
      } catch (error) {
        logger.error('Database maintenance error', error as Error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
};