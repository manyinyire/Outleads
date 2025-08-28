import nodemailer from 'nodemailer';
import { env } from '@/lib/utils/config/env-validation';
import { logger } from '@/lib/utils/logging/logger';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587', 10),
  secure: parseInt(env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendEmail(mailOptions: MailOptions) {
  if (!env.SMTP_HOST) {
    logger.warn('SMTP host not configured. Skipping email send.');
    // In development, you might want to log the email content instead of sending
    if (process.env.NODE_ENV === 'development') {
      logger.debug('--- Email Content ---');
      logger.debug(`To: ${mailOptions.to}`);
      logger.debug(`Subject: ${mailOptions.subject}`);
      logger.debug(`Body: ${mailOptions.text}`);
      logger.debug('---------------------');
    }
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      ...mailOptions,
    });
    logger.info('Email sent successfully', { messageId: info.messageId });
  } catch (error) {
    logger.error('Failed to send email', error as Error, { to: mailOptions.to, subject: mailOptions.subject });
    // Do not re-throw the error to avoid crashing the main process
  }
}
