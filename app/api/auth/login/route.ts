import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
    }

    // 1. Domain Authentication
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL is not configured in environment variables.');
    }

    let tokenResponse;
    try {
      tokenResponse = await axios.post(`${apiBaseUrl}/auth/service/token/`, { username, password });
    } catch (error) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const { token: apiToken } = tokenResponse.data;

    // 2. User Info Fetch
    const userInfoResponse = await axios.get(`${apiBaseUrl}/api/getuser/${username}`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    });

    const { userDetails } = userInfoResponse.data;
    const { first_: firstName, last_: surname, email_: email } = userDetails;

    if (!email) {
      return NextResponse.json({ message: 'User data from domain is incomplete (missing email).' }, { status: 500 });
    }

    // 3. User Management (for domain users)
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.status === 'PENDING') {
        return NextResponse.json({ message: 'Your access request is pending approval.' }, { status: 403 });
      }
      if (user.status !== 'APPROVED' && user.status !== 'ACTIVE') {
        return NextResponse.json({ message: 'Your account is not active.' }, { status: 403 });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: `${firstName} ${surname}`,
          email,
          username: email,
          status: 'PENDING',
        }
      });
      return NextResponse.json({ newUser: true, user: user });
    }

    // 4. Generate JWT for the logged-in domain user
    const localToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token: localToken, user: userWithoutPassword });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}