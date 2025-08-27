import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

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

      // Store in database for persistence (you might want to create an audit_logs table)
      // For now, we'll use the settings table as a simple audit log
      const auditKey = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const auditValue = JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString(),
      });

      await prisma.setting.create({
        data: {
          key: auditKey,
          value: auditValue,
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

  // Method to retrieve audit logs (you might want to create a proper audit_logs table for this)
  static async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            startsWith: 'audit_',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 100,
      });

      const auditLogs = settings
        .map((setting: any) => {
          try {
            return JSON.parse(setting.value) as AuditLogEntry & { timestamp: string };
          } catch {
            return null;
          }
        })
        .filter((log: any): log is AuditLogEntry & { timestamp: string } => log !== null)
        .filter((log: AuditLogEntry & { timestamp: string }) => {
          if (filters?.userId && log.userId !== filters.userId) return false;
          if (filters?.resource && log.resource !== filters.resource) return false;
          if (filters?.action && log.action !== filters.action) return false;
          if (filters?.fromDate && new Date(log.timestamp) < filters.fromDate) return false;
          if (filters?.toDate && new Date(log.timestamp) > filters.toDate) return false;
          return true;
        });

      return auditLogs;
    } catch (error) {
      logger.error('Failed to retrieve audit logs', error as Error);
      return [];
    }
  }
}
