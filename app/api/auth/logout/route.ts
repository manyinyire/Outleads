import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully.' });

  response.headers.set('Set-Cookie', serialize('refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  }));

  return response;
}
