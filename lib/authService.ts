import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { ApiError } from '@/lib/errors';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is not configured in environment variables.');
}

export async function authenticateDomainUser(username: string, password: string) {
  try {
    const response = await axios.post(apiBaseUrl!, { username, password });
    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: {
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        username: response.data.username,
        user_id: response.data.user_id,
        groups: response.data.groups,
        department: response.data.department,
        title: response.data.title
      }
    };
  } catch (error) {
    throw new ApiError('Invalid credentials.', 401);
  }
}

export async function getUserInfo(userInfo: any) {
  // Since the new API returns all user info in the login response,
  // we just need to format it for our system
  return {
    userDetails: {
      first_: userInfo.first_name,
      last_: userInfo.last_name,
      email_: `${userInfo.first_name.toLowerCase()}.${userInfo.last_name.toLowerCase()}@fbc.co.zw`, // Construct email from first and last name
      username: userInfo.username,
      user_id: userInfo.user_id,
      groups: userInfo.groups,
      department: userInfo.department,
      title: userInfo.title
    }
  };
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
