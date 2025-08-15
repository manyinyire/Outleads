import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader && authHeader.split(' ')[1];
    
    // Get token from cookie
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth-token')?.value;
    
    return NextResponse.json({
      debug: {
        hasAuthHeader: !!authHeader,
        authHeaderFormat: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
        headerTokenPreview: headerToken ? headerToken.substring(0, 20) + '...' : 'none',
        headerTokenLength: headerToken?.length || 0,
        headerTokenParts: headerToken ? headerToken.split('.').length : 0,
        hasCookieToken: !!cookieToken,
        cookieTokenPreview: cookieToken ? cookieToken.substring(0, 20) + '...' : 'none',
        cookieTokenLength: cookieToken?.length || 0,
        cookieTokenParts: cookieToken ? cookieToken.split('.').length : 0,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}