import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError, ZodSchema } from 'zod';
import { withAuth, AuthenticatedRequest } from './auth';

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

/**
 * Standard API success response format
 */
export interface ApiSuccess<T = any> {
  message?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Error response helper - ensures consistent error formatting
 */
export function errorResponse(
  message: string,
  status: number = 500,
  error?: string,
  details?: any
): NextResponse<ApiError> {
  const errorType = error || getErrorTypeFromStatus(status);
  
  console.error(`[API Error] ${errorType}: ${message}`, details);
  
  return NextResponse.json(
    {
      error: errorType,
      message,
      ...(details && { details })
    },
    { status }
  );
}

/**
 * Success response helper - ensures consistent success formatting
 */
export function successResponse<T = any>(
  data: T | { message: string; [key: string]: any },
  status: number = 200
): NextResponse<T | { message: string; [key: string]: any }> {
  return NextResponse.json(data, { status });
}

/**
 * Get error type from HTTP status code
 */
function getErrorTypeFromStatus(status: number): string {
  const errorMap: Record<number, string> = {
    400: 'Validation Error',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
  };
  
  return errorMap[status] || 'Error';
}

/**
 * Wraps an async handler with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error('Handler error:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error);
      }
      
      if (error instanceof ZodError) {
        return errorResponse(
          error.errors[0]?.message || 'Validation failed',
          400,
          'Validation Error',
          error.errors
        );
      }
      
      return errorResponse(
        error?.message || 'An unexpected error occurred',
        500
      );
    }
  }) as T;
}

/**
 * Handle Prisma-specific errors with appropriate messages
 */
export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case 'P2002': {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return errorResponse(`A record with this ${field} already exists`, 409);
    }
    
    case 'P2003':
      return errorResponse('Invalid reference: related record not found', 400);
    
    case 'P2025':
      return errorResponse('Record not found', 404);
    
    case 'P2014':
      return errorResponse('Cannot delete: record has dependent data', 409);
    
    default:
      return errorResponse('Database operation failed', 500, 'Database Error', {
        code: error.code,
        message: error.message
      });
  }
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error: any) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: errorResponse(
          error.errors[0]?.message || 'Validation failed',
          400,
          'Validation Error',
          error.errors
        )
      };
    }
    
    return {
      success: false,
      error: errorResponse('Invalid request body', 400)
    };
  }
}

/**
 * Generic CRUD operation wrapper with consistent error handling
 */
export async function performCrudOperation<T>(
  operation: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<NextResponse> {
  try {
    const result = await operation();
    
    if (successMessage) {
      return successResponse({ message: successMessage, data: result }, 201);
    }
    
    return successResponse(result);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return handlePrismaError(error);
    }
    
    const message = errorMessage || 'Operation failed';
    console.error(`CRUD operation error: ${message}`, error);
    return errorResponse(message);
  }
}

/**
 * Extract and validate ID parameter from route params
 */
export function extractId(params: { id?: string }): { success: true; id: string } | { success: false; error: NextResponse } {
  const id = params.id;
  
  if (!id || typeof id !== 'string') {
    return {
      success: false,
      error: errorResponse('Invalid or missing ID parameter', 400)
    };
  }
  
  return { success: true, id };
}

/**
 * Check if a record exists before performing operations
 */
export async function checkRecordExists<T>(
  findOperation: () => Promise<T | null>,
  entityName: string = 'Record'
): Promise<{ success: true; record: T } | { success: false; error: NextResponse }> {
  try {
    const record = await findOperation();
    
    if (!record) {
      return {
        success: false,
        error: errorResponse(`${entityName} not found`, 404)
      };
    }
    
    return { success: true, record };
  } catch (error: any) {
    console.error(`Error checking for ${entityName}:`, error);
    return {
      success: false,
      error: errorResponse(`Failed to check ${entityName.toLowerCase()} existence`, 500)
    };
  }
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extract pagination parameters from URL search params
 */
export function extractPaginationParams(url: string): PaginationParams {
  const { searchParams } = new URL(url);
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  };
}

/**
 * Middleware to check authentication and role
 */
export function withAuthAndRole(
  allowedRoles: string[],
  handler: (req: any, context?: any) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, context?: any) => {
    // Check if user has required role
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse('Insufficient permissions', 403);
    }
    
    // Pass the authenticated request with user context
    return handler(req, { ...context, user: req.user });
  });
}
