import { logger } from '@/lib/utils/logging/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * GDPR/SOC2 Compliance Audit Logger
 * Tracks all user actions and data access for compliance requirements
 */

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceData?: any; // Sanitized data
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  severity: AuditSeverity;
  complianceFlags?: ComplianceFlag[];
}

export enum AuditAction {
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Data Operations (GDPR Critical)
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // GDPR Specific Actions
  GDPR_CONSENT_GIVEN = 'GDPR_CONSENT_GIVEN',
  GDPR_CONSENT_WITHDRAWN = 'GDPR_CONSENT_WITHDRAWN',
  GDPR_DATA_SUBJECT_REQUEST = 'GDPR_DATA_SUBJECT_REQUEST',
  GDPR_RIGHT_TO_ERASURE = 'GDPR_RIGHT_TO_ERASURE',
  GDPR_DATA_PORTABILITY = 'GDPR_DATA_PORTABILITY',
  GDPR_DATA_RECTIFICATION = 'GDPR_DATA_RECTIFICATION',
  
  // System Operations
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  
  // Security Events
  SECURITY_BREACH_DETECTED = 'SECURITY_BREACH_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_ATTACK_BLOCKED = 'CSRF_ATTACK_BLOCKED',
  MALICIOUS_REQUEST_BLOCKED = 'MALICIOUS_REQUEST_BLOCKED',
  
  // Business Operations
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'CAMPAIGN_UPDATED',
  CAMPAIGN_DELETED = 'CAMPAIGN_DELETED',
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  LEAD_DELETED = 'LEAD_DELETED',
  
  // Administrative Actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  BULK_OPERATION = 'BULK_OPERATION',
}

export enum ResourceType {
  USER = 'USER',
  LEAD = 'LEAD',
  CAMPAIGN = 'CAMPAIGN',
  PRODUCT = 'PRODUCT',
  SECTOR = 'SECTOR',
  SETTING = 'SETTING',
  PERMISSION = 'PERMISSION',
  SESSION = 'SESSION',
  SYSTEM = 'SYSTEM',
}

export enum AuditSeverity {
  LOW = 'LOW',           // Regular operations
  MEDIUM = 'MEDIUM',     // Administrative actions
  HIGH = 'HIGH',         // Security events, data changes
  CRITICAL = 'CRITICAL', // Security breaches, GDPR violations
}

export enum ComplianceFlag {
  GDPR_PERSONAL_DATA = 'GDPR_PERSONAL_DATA',
  GDPR_SENSITIVE_DATA = 'GDPR_SENSITIVE_DATA',
  SOC2_AVAILABILITY = 'SOC2_AVAILABILITY',
  SOC2_CONFIDENTIALITY = 'SOC2_CONFIDENTIALITY',
  SOC2_PROCESSING_INTEGRITY = 'SOC2_PROCESSING_INTEGRITY',
  SOC2_PRIVACY = 'SOC2_PRIVACY',
  SOC2_SECURITY = 'SOC2_SECURITY',
  PCI_DSS = 'PCI_DSS',
  HIPAA = 'HIPAA',
}

export class ComplianceAuditLogger {
  /**
   * Log an audit event with GDPR/SOC2 compliance considerations
   */
  static async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      // Sanitize sensitive data before logging
      if (auditEntry.resourceData) {
        auditEntry.resourceData = this.sanitizeData(auditEntry.resourceData);
      }

      // Add compliance flags based on action and resource type
      auditEntry.complianceFlags = this.determineComplianceFlags(entry);

      // Log to application logger for immediate visibility
      logger.info('Audit event logged', {
        action: auditEntry.action,
        resourceType: auditEntry.resourceType,
        userId: auditEntry.userId,
        success: auditEntry.success,
        severity: auditEntry.severity,
        complianceFlags: auditEntry.complianceFlags,
        ipAddress: auditEntry.ipAddress,
        timestamp: auditEntry.timestamp.toISOString(),
      });

      // Store in database for compliance reporting
      await this.storeAuditEvent(auditEntry);

      // Send critical events to monitoring system
      if (auditEntry.severity === AuditSeverity.CRITICAL) {
        await this.alertSecurityTeam(auditEntry);
      }

    } catch (error) {
      // Never let audit logging failures break the application
      logger.error('Failed to log audit event', error as Error, { entry });
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuthEvent(
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail,
      action,
      resourceType: ResourceType.SESSION,
      success,
      ipAddress,
      userAgent,
      errorMessage,
      severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      complianceFlags: [ComplianceFlag.SOC2_SECURITY],
    });
  }

  /**
   * Log data access events (GDPR Critical)
   */
  static async logDataAccess(
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    userEmail: string,
    userRole: string,
    resourceData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const isPersonalData = this.containsPersonalData(resourceType, resourceData);
    const complianceFlags = [ComplianceFlag.SOC2_CONFIDENTIALITY];
    
    if (isPersonalData) {
      complianceFlags.push(ComplianceFlag.GDPR_PERSONAL_DATA);
    }

    await this.logEvent({
      userId,
      userEmail,
      userRole,
      action,
      resourceType,
      resourceId,
      resourceData,
      ipAddress,
      userAgent,
      success: true,
      severity: isPersonalData ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      complianceFlags,
    });
  }

  /**
   * Log GDPR-specific events
   */
  static async logGDPREvent(
    action: AuditAction,
    dataSubjectEmail: string,
    requestDetails: any,
    processedBy?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      userId: processedBy,
      userEmail: dataSubjectEmail,
      action,
      resourceType: ResourceType.USER,
      resourceData: requestDetails,
      ipAddress,
      success: true,
      severity: AuditSeverity.HIGH,
      complianceFlags: [
        ComplianceFlag.GDPR_PERSONAL_DATA,
        ComplianceFlag.SOC2_PRIVACY,
        ComplianceFlag.SOC2_CONFIDENTIALITY,
      ],
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: AuditAction,
    ipAddress: string,
    userAgent?: string,
    details?: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resourceType: ResourceType.SYSTEM,
      ipAddress,
      userAgent,
      resourceData: details,
      success: false,
      severity: AuditSeverity.CRITICAL,
      complianceFlags: [
        ComplianceFlag.SOC2_SECURITY,
        ComplianceFlag.SOC2_AVAILABILITY,
      ],
    });
  }

  /**
   * Generate compliance reports
   */
  static async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    reportType: 'GDPR' | 'SOC2' | 'SECURITY' | 'ALL'
  ): Promise<any> {
    try {
      const auditLogs = await this.getAuditLogs({
        startDate,
        endDate,
        reportType,
      });

      const report = {
        reportType,
        generatedAt: new Date(),
        period: { startDate, endDate },
        summary: this.generateReportSummary(auditLogs),
        events: auditLogs,
        complianceStatus: this.assessComplianceStatus(auditLogs),
      };

      // Log the report generation
      await this.logEvent({
        action: AuditAction.DATA_EXPORT,
        resourceType: ResourceType.SYSTEM,
        resourceData: { reportType, period: { startDate, endDate } },
        success: true,
        severity: AuditSeverity.MEDIUM,
        complianceFlags: [ComplianceFlag.SOC2_PRIVACY],
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', error as Error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private static sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Mask email addresses (keep first char and domain)
    if (sanitized.email && typeof sanitized.email === 'string') {
      const parts = sanitized.email.split('@');
      if (parts.length === 2) {
        sanitized.email = `${parts[0][0]}***@${parts[1]}`;
      }
    }

    // Mask phone numbers (keep last 4 digits)
    if (sanitized.phoneNumber && typeof sanitized.phoneNumber === 'string') {
      const phone = sanitized.phoneNumber.replace(/\D/g, '');
      if (phone.length > 4) {
        sanitized.phoneNumber = `***-***-${phone.slice(-4)}`;
      }
    }

    return sanitized;
  }

  private static determineComplianceFlags(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): ComplianceFlag[] {
    const flags: ComplianceFlag[] = [];

    // GDPR flags
    if (this.containsPersonalData(entry.resourceType, entry.resourceData)) {
      flags.push(ComplianceFlag.GDPR_PERSONAL_DATA);
    }

    // SOC2 flags based on action type
    if ([AuditAction.LOGIN, AuditAction.LOGOUT, AuditAction.UNAUTHORIZED_ACCESS].includes(entry.action)) {
      flags.push(ComplianceFlag.SOC2_SECURITY);
    }

    if ([AuditAction.DATA_READ, AuditAction.DATA_EXPORT].includes(entry.action)) {
      flags.push(ComplianceFlag.SOC2_CONFIDENTIALITY);
    }

    if ([AuditAction.DATA_CREATE, AuditAction.DATA_UPDATE, AuditAction.DATA_DELETE].includes(entry.action)) {
      flags.push(ComplianceFlag.SOC2_PROCESSING_INTEGRITY);
    }

    return flags;
  }

  private static containsPersonalData(resourceType: ResourceType, resourceData?: any): boolean {
    const personalDataTypes = [ResourceType.USER, ResourceType.LEAD];
    return personalDataTypes.includes(resourceType) || 
           (resourceData && (resourceData.email || resourceData.phoneNumber || resourceData.fullName));
  }

  private static async storeAuditEvent(entry: AuditLogEntry): Promise<void> {
    // In a real implementation, you might want to:
    // 1. Store in a separate audit database
    // 2. Use write-only database access
    // 3. Implement data retention policies
    
    // For now, we'll store using the existing logger
    logger.info('Compliance audit event', entry);
  }

  private static async alertSecurityTeam(entry: AuditLogEntry): Promise<void> {
    // In production, integrate with alerting systems like:
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
    // - SIEM systems
    
    logger.error('CRITICAL SECURITY EVENT', undefined, entry);
  }

  private static async getAuditLogs(params: {
    startDate: Date;
    endDate: Date;
    reportType: string;
  }): Promise<AuditLogEntry[]> {
    // Implementation would query your audit storage
    // This is a placeholder
    return [];
  }

  private static generateReportSummary(logs: AuditLogEntry[]): any {
    return {
      totalEvents: logs.length,
      securityEvents: logs.filter(l => l.severity === AuditSeverity.CRITICAL).length,
      gdprEvents: logs.filter(l => l.complianceFlags?.includes(ComplianceFlag.GDPR_PERSONAL_DATA)).length,
      failedOperations: logs.filter(l => !l.success).length,
    };
  }

  private static assessComplianceStatus(logs: AuditLogEntry[]): any {
    return {
      gdprCompliant: true, // Implement actual assessment logic
      soc2Compliant: true,
      lastAssessment: new Date(),
      recommendations: [],
    };
  }
}

// Helper function for easy integration with existing code
export const auditLog = ComplianceAuditLogger.logEvent;
export const auditAuth = ComplianceAuditLogger.logAuthEvent;
export const auditData = ComplianceAuditLogger.logDataAccess;
export const auditGDPR = ComplianceAuditLogger.logGDPREvent;
export const auditSecurity = ComplianceAuditLogger.logSecurityEvent;