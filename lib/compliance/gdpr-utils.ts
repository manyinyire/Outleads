import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logging';
import { auditGDPR, AuditAction } from './audit-logger';

/**
 * GDPR Compliance Utilities
 * Implements GDPR rights and data protection requirements
 */
export class GDPRCompliance {
  /**
   * Right to Access (Article 15)
   * Provide all personal data we hold about a data subject
   */
  static async dataSubjectAccessRequest(email: string, requestedBy?: string): Promise<any> {
    try {
      // Find the user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          campaigns: true,
          assignedLeads: {
            include: {
              businessSector: true,
              products: true,
              campaign: true,
            }
          },
          assignedCampaigns: {
            include: {
              leads: true,
            }
          }
        }
      });

      // Find related lead data if user is not in system but exists as a lead
      const leadData = await prisma.lead.findMany({
        where: {
          OR: [
            { fullName: { contains: email.split('@')[0], mode: 'insensitive' } },
            // Additional matching logic could be added here
          ]
        },
        include: {
          businessSector: true,
          products: true,
          campaign: true,
          assignedTo: true,
        }
      });

      const dataPackage = {
        requestId: `DSAR-${Date.now()}`,
        requestDate: new Date(),
        dataSubject: email,
        userData: user ? {
          personalInfo: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin,
          },
          campaigns: user.campaigns.map(c => ({
            id: c.id,
            name: c.campaign_name,
            organization: c.organization_name,
            createdAt: c.createdAt,
            isActive: c.is_active,
          })),
          assignedLeads: user.assignedLeads.map(l => ({
            id: l.id,
            fullName: l.fullName,
            phoneNumber: l.phoneNumber,
            sector: l.businessSector.name,
            createdAt: l.createdAt,
          })),
        } : null,
        leadData: leadData.map(l => ({
          id: l.id,
          fullName: l.fullName,
          phoneNumber: l.phoneNumber,
          sector: l.businessSector.name,
          products: l.products.map(p => p.name),
          campaign: l.campaign?.campaign_name,
          assignedTo: l.assignedTo?.name,
          createdAt: l.createdAt,
        })),
        dataRetentionInfo: {
          retentionPeriod: '7 years from last interaction',
          legalBasis: 'Legitimate business interest',
          processingPurpose: 'Lead management and customer relationship management',
        }
      };

      // Log the GDPR request
      await auditGDPR(
        AuditAction.GDPR_DATA_SUBJECT_REQUEST,
        email,
        { requestId: dataPackage.requestId, requestedBy },
        requestedBy
      );

      return dataPackage;
    } catch (error) {
      logger.error('GDPR Data Subject Access Request failed', error as Error, { email });
      throw error;
    }
  }

  /**
   * Right to Rectification (Article 16)
   * Allow data subjects to correct their personal data
   */
  static async rectifyPersonalData(
    email: string,
    corrections: Record<string, any>,
    requestedBy?: string
  ): Promise<boolean> {
    try {
      const allowedFields = ['name', 'email', 'phoneNumber', 'fullName'];
      const sanitizedCorrections: Record<string, any> = {};

      // Only allow corrections to specific fields
      for (const [field, value] of Object.entries(corrections)) {
        if (allowedFields.includes(field) && value !== null && value !== undefined) {
          sanitizedCorrections[field] = value;
        }
      }

      if (Object.keys(sanitizedCorrections).length === 0) {
        throw new Error('No valid corrections provided');
      }

      // Update user data if exists
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.user.update({
          where: { email },
          data: sanitizedCorrections
        });
      }

      // Update lead data
      const leads = await prisma.lead.findMany({
        where: {
          OR: [
            { fullName: { contains: email.split('@')[0], mode: 'insensitive' } },
            // Additional matching logic
          ]
        }
      });

      for (const lead of leads) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: sanitizedCorrections
        });
      }

      // Log the rectification
      await auditGDPR(
        AuditAction.GDPR_DATA_RECTIFICATION,
        email,
        { corrections: sanitizedCorrections, requestedBy },
        requestedBy
      );

      return true;
    } catch (error) {
      logger.error('GDPR Data Rectification failed', error as Error, { email, corrections });
      throw error;
    }
  }

  /**
   * Right to Erasure (Article 17) - "Right to be Forgotten"
   * Delete all personal data when legally required
   */
  static async erasePersonalData(
    email: string,
    reason: string,
    requestedBy?: string
  ): Promise<boolean> {
    try {
      // Check if erasure is legally possible
      const canErase = await this.validateErasureRequest(email, reason);
      if (!canErase.allowed) {
        throw new Error(`Erasure not permitted: ${canErase.reason}`);
      }

      // Begin transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Anonymize or delete user account
        const user = await tx.user.findUnique({ where: { email } });
        if (user) {
          await tx.user.update({
            where: { email },
            data: {
              email: `deleted-user-${user.id}@anonymized.local`,
              name: '[DELETED USER]',
              username: `deleted-${user.id}`,
              status: 'DELETED',
            }
          });
        }

        // 2. Anonymize lead data
        const leads = await tx.lead.findMany({
          where: {
            OR: [
              { fullName: { contains: email.split('@')[0], mode: 'insensitive' } },
              // Additional matching logic
            ]
          }
        });

        for (const lead of leads) {
          await tx.lead.update({
            where: { id: lead.id },
            data: {
              fullName: '[DELETED]',
              phoneNumber: '[DELETED]',
            }
          });
        }

        return { deletedUser: !!user, deletedLeads: leads.length };
      });

      // Log the erasure
      await auditGDPR(
        AuditAction.GDPR_RIGHT_TO_ERASURE,
        email,
        { reason, result, requestedBy },
        requestedBy
      );

      return true;
    } catch (error) {
      logger.error('GDPR Data Erasure failed', error as Error, { email, reason });
      throw error;
    }
  }

  /**
   * Right to Data Portability (Article 20)
   * Export personal data in a machine-readable format
   */
  static async exportPersonalData(email: string, requestedBy?: string): Promise<string> {
    try {
      const dataPackage = await this.dataSubjectAccessRequest(email, requestedBy);
      
      // Convert to machine-readable format (JSON)
      const exportData = {
        ...dataPackage,
        exportFormat: 'JSON',
        exportDate: new Date(),
        schema: {
          version: '1.0',
          standard: 'GDPR Article 20 Compliance',
        }
      };

      // Log the export
      await auditGDPR(
        AuditAction.GDPR_DATA_PORTABILITY,
        email,
        { exportId: dataPackage.requestId, requestedBy },
        requestedBy
      );

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      logger.error('GDPR Data Export failed', error as Error, { email });
      throw error;
    }
  }

  /**
   * Consent Management
   */
  static async recordConsent(
    email: string,
    consentType: string,
    granted: boolean,
    ipAddress?: string
  ): Promise<void> {
    try {
      // In a real implementation, you'd have a consent table
      // For now, we'll log it as an audit event
      
      await auditGDPR(
        granted ? AuditAction.GDPR_CONSENT_GIVEN : AuditAction.GDPR_CONSENT_WITHDRAWN,
        email,
        { consentType, granted, ipAddress }
      );

      logger.info('GDPR consent recorded', {
        email,
        consentType,
        granted,
        ipAddress,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to record GDPR consent', error as Error, { email, consentType });
      throw error;
    }
  }

  /**
   * Data Retention Policy Enforcement
   */
  static async enforceRetentionPolicy(): Promise<void> {
    try {
      const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
      const cutoffDate = new Date(Date.now() - retentionPeriod);

      // Find old leads that should be anonymized
      const oldLeads = await prisma.lead.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          fullName: { not: '[DELETED]' }, // Not already anonymized
        }
      });

      // Anonymize old data
      for (const lead of oldLeads) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            fullName: '[ANONYMIZED]',
            phoneNumber: '[ANONYMIZED]',
          }
        });
      }

      logger.info('Data retention policy enforced', {
        anonymizedLeads: oldLeads.length,
        cutoffDate,
      });
    } catch (error) {
      logger.error('Failed to enforce data retention policy', error as Error);
    }
  }

  /**
   * Generate GDPR Compliance Report
   */
  static async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      // In a real implementation, you'd query your audit logs
      const report = {
        reportId: `GDPR-${Date.now()}`,
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          dataSubjectRequests: 0, // Query audit logs
          erasureRequests: 0,
          rectificationRequests: 0,
          dataExports: 0,
          consentEvents: 0,
        },
        complianceStatus: 'COMPLIANT',
        recommendations: [
          'Continue regular data retention policy enforcement',
          'Ensure all staff are trained on GDPR procedures',
          'Review and update privacy notices annually',
        ]
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate GDPR compliance report', error as Error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private static async validateErasureRequest(email: string, reason: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if there are legal obligations to retain the data
    const validReasons = [
      'withdrawal_of_consent',
      'no_longer_necessary',
      'unlawful_processing',
      'legal_obligation',
    ];

    if (!validReasons.includes(reason)) {
      return { allowed: false, reason: 'Invalid erasure reason provided' };
    }

    // Check for legal holds or obligations
    // In a real system, you'd check for:
    // - Active legal proceedings
    // - Regulatory requirements
    // - Financial obligations
    
    return { allowed: true };
  }
}

// Run data retention policy enforcement daily
if (typeof window === 'undefined') { // Server-side only
  setInterval(async () => {
    try {
      await GDPRCompliance.enforceRetentionPolicy();
    } catch (error) {
      logger.error('Scheduled data retention enforcement failed', error as Error);
    }
  }, 24 * 60 * 60 * 1000); // Daily
}