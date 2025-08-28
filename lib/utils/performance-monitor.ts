import { logger } from './logging/logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers = new Map<string, number>();

  startTimer(name: string, metadata?: Record<string, any>): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTimers.set(timerId, Date.now());
    
    if (metadata) {
      logger.debug(`Performance timer started: ${name}`, metadata);
    }
    
    return timerId;
  }

  endTimer(timerId: string, metadata?: Record<string, any>): number | null {
    const startTime = this.activeTimers.get(timerId);
    if (!startTime) {
      logger.warn('Performance timer not found', { timerId });
      return null;
    }

    const duration = Date.now() - startTime;
    this.activeTimers.delete(timerId);

    const metric: PerformanceMetric = {
      name: timerId.split('_')[0],
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);
    
    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${metric.name}`, {
        duration,
        metadata,
      });
    }

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timerId = this.startTimer(name, metadata);
      
      try {
        const result = await fn();
        this.endTimer(timerId, metadata);
        resolve(result);
      } catch (error) {
        this.endTimer(timerId, { ...metadata, error: true });
        reject(error);
      }
    });
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const timerId = this.startTimer(name, metadata);
    
    try {
      const result = fn();
      this.endTimer(timerId, metadata);
      return result;
    } catch (error) {
      this.endTimer(timerId, { ...metadata, error: true });
      throw error;
    }
  }

  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = this.metrics.filter(metric => metric.name === name);
    }
    
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAverageTime(name: string, timeWindowMs: number = 5 * 60 * 1000): number | null {
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentMetrics = this.metrics.filter(
      metric => metric.name === name && metric.timestamp > cutoff
    );

    if (recentMetrics.length === 0) return null;

    const total = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / recentMetrics.length;
  }

  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }

  getStats() {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => now - m.timestamp.getTime() < 5 * 60 * 1000);
    const last1Hour = this.metrics.filter(m => now - m.timestamp.getTime() < 60 * 60 * 1000);

    const operationCounts = this.metrics.reduce((acc, metric) => {
      acc[metric.name] = (acc[metric.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOperations: this.metrics.length,
      operationsLast5Min: last5Minutes.length,
      operationsLastHour: last1Hour.length,
      operationCounts,
      averageResponseTime: this.metrics.length > 0 
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length 
        : 0,
      slowestOperation: this.metrics.length > 0 
        ? Math.max(...this.metrics.map(m => m.duration))
        : 0,
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Decorator for measuring method performance
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return performanceMonitor.measureAsync(methodName, () => originalMethod.apply(this, args));
      } else {
        return performanceMonitor.measureSync(methodName, () => originalMethod.apply(this, args));
      }
    };

    return descriptor;
  };
}
