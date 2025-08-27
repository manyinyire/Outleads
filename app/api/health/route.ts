import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getDatabaseStats } from '@/lib/database-health';
import { performanceMonitor } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Get basic stats
    const stats = await getDatabaseStats();
    
    // Get performance metrics
    const perfStats = performanceMonitor.getStats();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
        errors: dbHealth.errors,
      },
      stats,
      performance: perfStats,
      responseTime,
    };
    
    const httpStatus = dbHealth.status === 'healthy' ? 200 : 
                      dbHealth.status === 'degraded' ? 200 : 503;
    
    logger.info('Health check completed', {
      status: dbHealth.status,
      responseTime,
      dbResponseTime: dbHealth.responseTime,
    });
    
    return NextResponse.json(healthStatus, { status: httpStatus });
    
  } catch (error) {
    logger.error('Health check failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
