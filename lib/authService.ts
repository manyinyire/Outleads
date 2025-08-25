import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { ApiError } from '@/lib/errors';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is not configured in environment variables.');
}

export async function authenticateDomainUser(username: string, password: string) {
  try {
    const response = await axios.post(`${apiBaseUrl}/auth/service/token/`, { username, password });
    return response.data.token;
  } catch (error) {
    throw new ApiError('Invalid credentials.', 401);
  }
}

export async function getUserInfo(username: string, token: string) {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/getuser/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch user info.', 500);
  }
}

export async function manageUser(userInfo: any) {
  const { userDetails } = userInfo;
  const { first_: firstName, last_: surname, email_: email } = userDetails;

  if (!email) {
    throw new ApiError('User data from domain is incomplete (missing email).', 500);
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.status === 'PENDING') {
      throw new ApiError('Your access request is pending approval.', 403);
    }
    if (user.status !== 'APPROVED' && user.status !== 'ACTIVE') {
      throw new ApiError('Your account is not active.', 403);
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
    return { newUser: true, user };
  }

  return { newUser: false, user };
}
