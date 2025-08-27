import { NextResponse, NextRequest } from 'next/server';
import { withAuthAndRole } from '@/lib/auth/auth';

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Use 'q' as the search parameter to avoid conflicts with the table's 'search'
    const search = searchParams.get('q') || ''; 

    // If search is empty, the external API should return all users.
    // We construct the URL accordingly.
    const externalUrl = `${process.env.GET_ALL_USERS_URL}?search=${encodeURIComponent(search)}`;

    const authToken = req.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const response = await fetch(externalUrl, { headers });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('External API error:', errorData);
      return NextResponse.json({ message: `Failed to fetch users from external source. Status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN', 'BSS'], handler);