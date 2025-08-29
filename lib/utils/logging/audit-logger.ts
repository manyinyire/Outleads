import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logging/logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogger {
  static async log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    try {
      // Log to structured logger first
      logger.info(`Audit: ${entry.action} on ${entry.resource}`, {
        userId: entry.userId,
        resourceId: entry.resourceId,
        details: entry.details,
        ipAddress: entry.ipAddress,
      });

      // Store in database for persistence
      await prisma.auditLog.create({
        data: {
          ...entry,
          details: entry.details || undefined,
        },
      });

    } catch (error) {
      logger.error('Failed to write audit log', error as Error, {
        auditEntry: entry,
      });
    }
  }

  // Convenience methods for common audit events
  static async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    request?: { ip?: string; userAgent?: string }
  ) {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    });
  }

  static async logAuthEvent(
    action: 'login' | 'logout' | 'login_failed' | 'token_refresh',
    userId?: string,
    details?: Record<string, any>,
    request?: { ip?: string; userAgent?: string }
  ) {
    await this.log({
      userId,
      action,
      resource: 'authentication',
      details,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    });
  }

  static async logDataChange(
    userId: string,
    action: 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>,
    request?: { ip?: string; userAgent?: string }
  ) {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details: {
        oldData,
        newData,
        changes: oldData && newData ? this.getChanges(oldData, newData) : undefined,
      },
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    });
  }

  private static getChanges(oldData: Record<string, any>, newData: Record<string, any>): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};
    
    // Check for changed and new fields
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    });

    // Check for removed fields
    Object.keys(oldData).forEach(key => {
      if (!(key in newData)) {
        changes[key] = { from: oldData[key], to: undefined };
      }
    });

    return changes;
  }

  // Method to retrieve audit logs
  static async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    try {
      const where: any = {};
      if (filters?.userId) where.userId = filters.userId;
      if (filters?.resource) where.resource = filters.resource;
      if (filters?.action) where.action = filters.action;
      if (filters?.fromDate || filters?.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 100,
      });

      return auditLogs;
    } catch (error) {
      logger.error('Failed to retrieve audit logs', error as Error);
      return [];
    }
  }
}
