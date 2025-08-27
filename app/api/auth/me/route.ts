import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return NextResponse.json({
      user: req.user,
      isAuthenticated: true
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile'
    }, { status: 500 });
  }
});