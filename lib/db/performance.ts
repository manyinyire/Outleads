/**
 * Database performance monitoring utilities
 */

interface QueryMetrics {
  queryName: string;
  duration: number;
  timestamp: Date;
}

class DatabasePerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 100; // Keep last 100 queries

  /**
   * Measure the execution time of a database query
   */
  async measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        queryName,
        duration,
        timestamp: new Date(),
      });
      
      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        console.warn(`[DB Performance] Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[DB Performance] Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Record a query metric
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(queryName?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  } | null {
    const relevantMetrics = queryName
      ? this.metrics.filter(m => m.queryName === queryName)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map(m => m.duration);
    
    return {
      count: relevantMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }
}

// Export singleton instance
export const DatabasePerformance = new DatabasePerformanceMonitor();
