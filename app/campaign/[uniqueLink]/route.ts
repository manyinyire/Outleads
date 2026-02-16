import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: { uniqueLink: string } }) {
  try {
    const { uniqueLink } = params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const campaign = await prisma.campaign.findUnique({
      where: { uniqueLink },
    });

    if (!campaign?.is_active) {
      // Redirect to the main page even if the campaign is not found or inactive
      return NextResponse.redirect(baseUrl);
    }

    // Increment click count only once per session
    // Check if this is a unique click by looking at cookies/headers
    const cookieName = `campaign_${campaign.id}_clicked`;
    const hasCookie = req.headers.get('cookie')?.includes(cookieName);

    if (!hasCookie) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          click_count: {
            increment: 1,
          },
        },
      });
    }

    // Redirect to the main page with the campaign ID as a query parameter
    const redirectUrl = new URL(baseUrl);
    redirectUrl.searchParams.set('campaignId', campaign.id);

    const response = NextResponse.redirect(redirectUrl.toString());
    
    // Set a cookie to track this click (expires in 24 hours)
    if (!hasCookie) {
      response.cookies.set(cookieName, 'true', {
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error handling campaign link:', error);
    // Always redirect to the main page in case of an error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(baseUrl);
  }
}