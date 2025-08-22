import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

// This handler is protected by the withAuth middleware.
// If the token is valid, the middleware attaches the user object to the request.
async function handler(req: AuthenticatedRequest) {
  try {
    // If withAuth middleware succeeds, req.user will be populated.
    // We can just return the user data.
    return successResponse({ user: req.user });
  } catch (error) {
    // This catch block is for unexpected errors, as withAuth handles auth errors.
    console.error('Verification error:', error);
    return errorResponse('An internal server error occurred during verification.', 500);
  }
}

export const GET = withAuth(handler);