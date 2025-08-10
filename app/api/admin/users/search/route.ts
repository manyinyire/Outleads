import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://hrms.fbc.co.zw/api/allusers/${username}`)
    if (response.ok) {
      const data = await response.json()
      // The API returns a single object, not an array. Wrap it in an array.
      return NextResponse.json([data])
    } else {
      return NextResponse.json({ error: 'Failed to fetch user from HRMS' }, { status: response.status })
    }
  } catch (error) {
    console.error('HRMS user search error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
