import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { JWT_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRATION } from '@/lib/utils/config/config';
import { logger } from '@/lib/utils/logging/logger';

interface DecodedToken {
  userId: string;
}

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh-token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Refresh token not found.' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as DecodedToken;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 401 });
    }

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });

    return NextResponse.json({ token: accessToken });
  } catch (error) {
    logger.error('Refresh token error', error as Error);
    return NextResponse.json({ message: 'Invalid refresh token.' }, { status: 403 });
  }
}
