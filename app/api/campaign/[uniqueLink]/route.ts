import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { uniqueLink: string } }) {
  try {
    const { uniqueLink } = params;

    const campaign = await prisma.campaign.findUnique({
      where: { uniqueLink },
    });

    if (!campaign || !campaign.is_active) {
      // Redirect to the main page even if the campaign is not found or inactive
      // to avoid showing a 404 page to potential leads.
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hrms.fbc.co.zw';
      return NextResponse.redirect(baseUrl);
    }

    // Increment click count
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        click_count: {
          increment: 1,
        },
      },
    });

    // Redirect to the main page with the campaign ID as a query parameter
    const redirectUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://hrms.fbc.co.zw');
    redirectUrl.searchParams.set('campaignId', campaign.id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error handling campaign link:', error);
    // Always redirect to the main page in case of an error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hrms.fbc.co.zw';
    return NextResponse.redirect(baseUrl);
  }
}
