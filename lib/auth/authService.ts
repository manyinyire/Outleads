import { prisma } from '@/lib/db/prisma';
import axios from 'axios';
import { ApiError } from '@/lib/utils/errors/errors';
import { sendEmail } from '@/lib/email/email';
import { env } from '@/lib/utils/config/env-validation';
import { logger } from '@/lib/utils/logging';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is not configured in environment variables.');
}

export async function authenticateDomainUser(username: string, password: string) {
  try {
    logger.debug('Attempting domain authentication', { username, apiBaseUrl });
    const response = await axios.post(apiBaseUrl!, { username, password });
    logger.info('Domain authentication successful', { username });
    logger.debug('AD response data', { responseData: response.data });
    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: {
        first_name: response.data.firstname,
        last_name: response.data.lastname,
        username: response.data.user,
        user_id: response.data.id,
        email: response.data.email,
        groups: response.data.groups || [],
        department: response.data.department,
        title: response.data.title
      }
    };
  } catch (error) {
    logger.error('Domain authentication failed', error as Error, { username });
    if (axios.isAxiosError(error)) {
      logger.debug('Authentication error details', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    throw new ApiError('Invalid credentials.', 401);
  }
}

export async function getUserInfo(userInfo: any) {
  logger.debug('Processing user info', { userInfo });
  
  const firstName = userInfo.first_name || userInfo.firstName || '';
  const lastName = userInfo.last_name || userInfo.lastName || '';
  const username = userInfo.username || userInfo.user || '';
  
  let email = userInfo.email;
  if (!email && firstName && lastName) {
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fbc.co.zw`;
  }
  
  if (email) {
    email = email.toLowerCase();
  }
  
  return {
    userDetails: {
      first_: firstName,
      last_: lastName,
      email_: email,
      username: username,
      user_id: userInfo.user_id || userInfo.userId,
      groups: userInfo.groups || [],
      department: userInfo.department || '',
      title: userInfo.title || ''
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

    // Send notification emails
    if (env.ADMIN_EMAIL) {
      await sendEmail({
        to: env.ADMIN_EMAIL,
        subject: 'New User Access Request',
        text: `A new user has requested access to the Outleads platform.\n\nName: ${user.name}\nEmail: ${user.email}\n\nPlease log in to the admin dashboard to approve or reject this request.`, 
        html: `<p>A new user has requested access to the Outleads platform.</p><ul><li><strong>Name:</strong> ${user.name}</li><li><strong>Email:</strong> ${user.email}</li></ul><p>Please log in to the admin dashboard to approve or reject this request.</p>`,
      });
    }

    await sendEmail({
      to: user.email,
      subject: 'Your Access Request has been Received',
      text: `Hello ${user.name},

We have received your request for access to the Outleads platform. Your request is currently pending approval.

You will receive another email once your account has been approved.

Thank you,
The Outleads Team`,
      html: `<p>Hello ${user.name},</p><p>We have received your request for access to the Outleads platform. Your request is currently pending approval.</p><p>You will receive another email once your account has been approved.</p><p>Thank you,<br>The Outleads Team</p>`,
    });

    return { newUser: true, user };
  }

  return { newUser: false, user };
}