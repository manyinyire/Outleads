import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Database query optimization utilities
 */
// ... (rest of the file remains the same)


/**
 * Build optimized include/select queries to prevent overfetching
 */
export const queryOptimizer = {
  /**
   * Get minimal fields for list views
   */
  getListFields: <T extends Record<string, any>>(fields: (keyof T)[]) => {
    return fields.reduce((acc, field) => {
      acc[field as string] = true
      return acc
    }, {} as Record<string, boolean>)
  },

  /**
   * Build optimized include object with specific fields
   */
  buildInclude: (relations: Record<string, string[] | boolean>) => {
    const include: any = {}
    
    for (const [relation, fields] of Object.entries(relations)) {
      if (fields === true) {
        include[relation] = true
      } else if (Array.isArray(fields)) {
        include[relation] = {
          select: fields.reduce((acc, field) => {
            acc[field] = true
            return acc
          }, {} as Record<string, boolean>)
        }
      }
    }
    
    return include
  },

  /**
   * Add pagination to query
   */
  paginate: (page: number = 1, limit: number = 10) => ({
    skip: (page - 1) * limit,
    take: limit,
  }),

  /**
   * Build search conditions for multiple fields
   */
  buildSearchConditions: (searchTerm: string, fields: string[]) => {
    if (!searchTerm || !fields.length) return {}
    
    return {
      OR: fields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        }
      }))
    }
  },

  /**
   * Build date range filter
   */
  buildDateRangeFilter: (field: string, from?: Date, to?: Date) => {
    if (!from && !to) return {}
    
    const filter: any = {}
    if (from) filter.gte = from
    if (to) filter.lte = to
    
    return { [field]: filter }
  },
}

/**
 * Transaction helper for atomic operations
 */
export async function executeTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback)
}

/**
 * Batch operations for better performance
 */
export const batchOperations = {
  /**
   * Create multiple records in a single query
   */
  createMany: async <T>(
    model: keyof typeof prisma,
    data: any[]
  ) => {
    return (prisma[model] as any).createMany({
      data,
      skipDuplicates: true,
    })
  },

  /**
   * Update multiple records with same data
   */
  updateMany: async <T>(
    model: keyof typeof prisma,
    where: any,
    data: any
  ) => {
    return (prisma[model] as any).updateMany({
      where,
      data,
    })
  },

  /**
   * Delete multiple records
   */
  deleteMany: async <T>(
    model: keyof typeof prisma,
    where: any
  ) => {
    return (prisma[model] as any).deleteMany({
      where,
    })
  },
}

/**
 * Connection pool management
 */
export const connectionPool = {
  /**
   * Get connection status
   */
  getStatus: async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { connected: true, error: null }
    } catch (error) {
      return { connected: false, error }
    }
  },

  /**
   * Disconnect from database
   */
  disconnect: async () => {
    await prisma.$disconnect()
  },
}

/**
 * Query performance monitoring
 */
export const performanceMonitor = {
  /**
   * Measure query execution time
   */
  measureQuery: async <T>(
    name: string,
    query: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await query()
    const duration = performance.now() - start
    
    if (duration > 1000) {
      console.warn(`Slow query detected: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  },

  /**
   * Log slow queries
   */
  logSlowQuery: (query: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      console.warn(`Slow query (${duration.toFixed(2)}ms):`, query)
    }
  },
}

/**
 * Cache helpers for frequently accessed data
 */
export class QueryCache<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map()
  private ttl: number // Time to live in milliseconds

  constructor(ttlSeconds: number = 60) {
    this.ttl = ttlSeconds * 1000
  }

  /**
   * Get cached data
   */
  get(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  /**
   * Set cached data
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
}

/**
 * Optimized aggregation queries
 */
export const aggregations = {
  /**
   * Count records with conditions
   */
  count: async (
    model: keyof typeof prisma,
    where?: any
  ): Promise<number> => {
    return (prisma[model] as any).count({ where })
  },

  /**
   * Group by with aggregations
   */
  groupBy: async (
    model: keyof typeof prisma,
    options: {
      by: string[]
      where?: any
      _count?: boolean | Record<string, boolean>
      _sum?: Record<string, boolean>
      _avg?: Record<string, boolean>
      _min?: Record<string, boolean>
      _max?: Record<string, boolean>
    }
  ) => {
    return (prisma[model] as any).groupBy(options)
  },

  /**
   * Get statistics for a model
   */
  getStats: async (
    model: keyof typeof prisma,
    field: string,
    where?: any
  ) => {
    const result = await (prisma[model] as any).aggregate({
      where,
      _count: { [field]: true },
      _min: { [field]: true },
      _max: { [field]: true },
      _avg: { [field]: true },
    })
    
    return result
  },
}

/**
 * Database health checks
 */
export const healthCheck = {
  /**
   * Check database connectivity
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  },

  /**
   * Get database metrics
   */
  getMetrics: async () => {
    const [userCount, productCount, leadCount, campaignCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.lead.count(),
      prisma.campaign.count(),
    ])
    
    return {
      users: userCount,
      products: productCount,
      leads: leadCount,
      campaigns: campaignCount,
      timestamp: new Date(),
    }
  },
}
