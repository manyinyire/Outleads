import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

export interface DatabaseHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  activeConnections?: number;
  errors: string[];
  timestamp: Date;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();
  const errors: string[] = [];
  let status: DatabaseHealthCheck['status'] = 'healthy';

  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test write capability
    await prisma.setting.upsert({
      where: { key: 'health_check' },
      update: { value: new Date().toISOString() },
      create: { key: 'health_check', value: new Date().toISOString() }
    });

    const responseTime = Date.now() - startTime;

    // Check response time thresholds
    if (responseTime > 5000) {
      status = 'unhealthy';
      errors.push('Database response time exceeds 5 seconds');
    } else if (responseTime > 1000) {
      status = 'degraded';
      errors.push('Database response time is slow (>1s)');
    }

    return {
      status,
      responseTime,
      errors,
      timestamp: new Date(),
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    logger.error('Database health check failed', error as Error);
    
    return {
      status: 'unhealthy',
      responseTime,
      errors: [errorMessage],
      timestamp: new Date(),
    };
  }
}

export async function getDatabaseStats() {
  try {
    const [userCount, campaignCount, leadCount, productCount] = await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.product.count(),
    ]);

    return {
      users: userCount,
      campaigns: campaignCount,
      leads: leadCount,
      products: productCount,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Failed to get database stats', error as Error);
    throw error;
  }
}

// Connection pool monitoring
export async function getConnectionInfo() {
  try {
    // This would need to be adapted based on your specific PostgreSQL setup
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
    `;
    
    return {
      activeConnections: result[0]?.count || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.warn('Could not retrieve connection info', error as Error);
    return {
      activeConnections: null,
      timestamp: new Date(),
    };
  }
}
