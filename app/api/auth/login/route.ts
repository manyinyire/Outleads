import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticateDomainUser, getUserInfo, manageUser } from '@/lib/authService';
import { ApiError } from '@/lib/errors';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = loginSchema.parse(body);

    const authResult = await authenticateDomainUser(username, password);
    const userInfo = await getUserInfo(authResult.user);
    const { newUser, user } = await manageUser(userInfo);

    if (newUser) {
      return NextResponse.json({ newUser, user });
    }

    const localToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token: localToken, user: userWithoutPassword });

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
