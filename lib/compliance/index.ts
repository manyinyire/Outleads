import React from 'react';

/**
 * Compliance Index
 * Export all compliance-related utilities and components
 */

// Audit logging
export {
  ComplianceAuditLogger,
  auditLog,
  auditAuth,
  auditData,
  auditGDPR,
  auditSecurity,
  AuditAction,
  ResourceType,
  AuditSeverity,
  ComplianceFlag,
  type AuditLogEntry,
} from './audit-logger';

// Import types for internal use
import type { ResourceType } from './audit-logger';

// GDPR utilities
export {
  GDPRCompliance,
} from './gdpr-utils';

// Export types for external use
export type {
  AuditLogEntry as IAuditLogEntry,
} from './audit-logger';

/**
 * Quick compliance helper functions for common use cases
 */
export const ComplianceHelpers = {
  /**
   * Log user data access (for GDPR compliance)
   */
  logDataAccess: async (
    userId: string,
    userEmail: string,
    resourceType: ResourceType,
    resourceId: string,
    action: 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT',
    ipAddress?: string
  ) => {
    const { auditData, AuditAction, ResourceType } = await import('./audit-logger');
    
    const actionMap = {
      VIEW: AuditAction.DATA_READ,
      EDIT: AuditAction.DATA_UPDATE,
      DELETE: AuditAction.DATA_DELETE,
      EXPORT: AuditAction.DATA_EXPORT,
    };
    
    return auditData(
      actionMap[action],
      resourceType,
      resourceId,
      userId,
      userEmail,
      'USER', // default role
      undefined,
      ipAddress
    );
  },

  /**
   * Quick GDPR data subject request
   */
  handleDataSubjectRequest: async (email: string, requestType: 'access' | 'delete' | 'export') => {
    const { GDPRCompliance } = await import('./gdpr-utils');
    
    switch (requestType) {
      case 'access':
        return GDPRCompliance.dataSubjectAccessRequest(email);
      case 'delete':
        return GDPRCompliance.erasePersonalData(email, 'withdrawal_of_consent');
      case 'export':
        return GDPRCompliance.exportPersonalData(email);
      default:
        throw new Error('Invalid request type');
    }
  },

  /**
   * Log security event
   */
  logSecurityEvent: async (
    eventType: 'RATE_LIMIT' | 'CSRF' | 'MALICIOUS' | 'BREACH',
    ipAddress: string,
    details?: any
  ) => {
    const { auditSecurity, AuditAction } = await import('./audit-logger');
    
    const actionMap = {
      RATE_LIMIT: AuditAction.RATE_LIMIT_EXCEEDED,
      CSRF: AuditAction.CSRF_ATTACK_BLOCKED,
      MALICIOUS: AuditAction.MALICIOUS_REQUEST_BLOCKED,
      BREACH: AuditAction.SECURITY_BREACH_DETECTED,
    };
    
    return auditSecurity(
      actionMap[eventType],
      ipAddress,
      undefined,
      details
    );
  },

  /**
   * Check if data contains personal information (GDPR)
   */
  containsPersonalData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    const personalDataFields = [
      'email', 'phone', 'phoneNumber', 'fullName', 'name',
      'address', 'ssn', 'passport', 'dob', 'dateOfBirth'
    ];
    
    return personalDataFields.some(field => 
      data.hasOwnProperty(field) && data[field]
    );
  },

  /**
   * Sanitize data for logging (remove/mask PII)
   */
  sanitizeForLogging: (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Mask email
    if (sanitized.email) {
      const [local, domain] = sanitized.email.split('@');
      sanitized.email = `${local[0]}***@${domain}`;
    }
    
    // Mask phone
    if (sanitized.phoneNumber || sanitized.phone) {
      const phone = sanitized.phoneNumber || sanitized.phone;
      sanitized.phoneNumber = `***-***-${phone.slice(-4)}`;
      if (sanitized.phone) sanitized.phone = sanitized.phoneNumber;
    }
    
    // Mask name
    if (sanitized.fullName) {
      const parts = sanitized.fullName.split(' ');
      sanitized.fullName = `${parts[0][0]}*** ${parts[parts.length - 1][0]}***`;
    }
    
    return sanitized;
  },
};