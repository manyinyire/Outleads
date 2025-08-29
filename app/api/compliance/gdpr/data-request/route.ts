import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthAndRole } from '@/lib/auth/auth';
import { GDPRCompliance } from '@/lib/compliance/gdpr-utils';
import { validateRequest } from '@/lib/middleware/validation';
import { enhancedErrorResponse, successResponse } from '@/lib/api/api-utils';

const dataRequestSchema = z.object({
  email: z.string().email('Valid email address required'),
  requestType: z.enum(['access', 'rectification', 'erasure', 'portability']),
  reason: z.string().optional(),
  corrections: z.record(z.any()).optional(),
});

export const POST = withAuthAndRole(['ADMIN', 'BSS', 'INFOSEC'], async (req: NextRequest) => {
  try {
    const validation = await validateRequest(dataRequestSchema)(req);
    if (!validation.success) {
      return validation.error;
    }

    const { email, requestType, reason, corrections } = validation.data;
    const requestedBy = (req as any).user?.id;

    let result;

    switch (requestType) {
      case 'access':
        result = await GDPRCompliance.dataSubjectAccessRequest(email, requestedBy);
        break;
      
      case 'rectification':
        if (!corrections) {
          return enhancedErrorResponse(
            'Corrections data required for rectification request',
            400,
            'Validation Error'
          );
        }
        result = await GDPRCompliance.rectifyPersonalData(email, corrections, requestedBy);
        break;
      
      case 'erasure':
        if (!reason) {
          return enhancedErrorResponse(
            'Reason required for erasure request',
            400,
            'Validation Error'
          );
        }
        result = await GDPRCompliance.erasePersonalData(email, reason, requestedBy);
        break;
      
      case 'portability':
        result = await GDPRCompliance.exportPersonalData(email, requestedBy);
        // For data portability, return as downloadable file
        return new NextResponse(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="gdpr-export-${email}-${Date.now()}.json"`,
          },
        });
    }

    return successResponse({
      message: `GDPR ${requestType} request processed successfully`,
      data: result,
      requestId: `GDPR-${requestType.toUpperCase()}-${Date.now()}`,
    });

  } catch (error) {
    return enhancedErrorResponse(
      `GDPR request processing failed: ${(error as Error).message}`,
      500,
      'GDPR Processing Error',
      undefined,
      'The GDPR request could not be processed. Please contact the data protection officer.'
    );
  }
});

// Get GDPR compliance status
export const GET = withAuthAndRole(['ADMIN', 'BSS', 'INFOSEC'], async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return enhancedErrorResponse(
        'Start date and end date are required',
        400,
        'Validation Error'
      );
    }

    const report = await GDPRCompliance.generateComplianceReport(
      new Date(startDate),
      new Date(endDate)
    );

    return successResponse({
      message: 'GDPR compliance report generated successfully',
      data: report,
    });

  } catch (error) {
    return enhancedErrorResponse(
      `Failed to generate GDPR compliance report: ${(error as Error).message}`,
      500,
      'Report Generation Error'
    );
  }
});