import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

// POST - Parse CSV body and bulk insert leads into pool
export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const pool = await prisma.leadPool.findUnique({
      where: { id: params.id },
      include: { campaign: true },
    });

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 });
    }

    const body = await req.json();
    const { rows } = body as { rows: Array<Record<string, string>> };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    // Fetch default sector as fallback
    const defaultSector = await prisma.sector.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!defaultSector) {
      return NextResponse.json({ error: 'No business sector configured. Please add a sector first.' }, { status: 500 });
    }

    // Fetch all sectors and products for matching
    const [allSectors, allProducts] = await Promise.all([
      prisma.sector.findMany({ select: { id: true, name: true } }),
      prisma.product.findMany({ select: { id: true, name: true } }),
    ]);

    // Get all existing phone numbers to detect duplicates
    const phoneNumbers = rows
      .map((r) => normalizePhone(r['Phone Number'] || r['phone_number'] || r['phone'] || ''))
      .filter(Boolean);

    const existingLeads = await prisma.lead.findMany({
      where: { phoneNumber: { in: phoneNumbers } },
      select: { phoneNumber: true },
    });
    const existingPhones = new Set(existingLeads.map((l) => l.phoneNumber));

    const imported: string[] = [];
    const duplicates: string[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    const leadsToCreate: Array<{
      fullName: string;
      phoneNumber: string;
      sectorId: string;
      campaignId: string;
      leadPoolId: string;
      products?: { connect: Array<{ id: string }> };
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const fullName = (row['Full Name'] || row['full_name'] || row['name'] || '').trim();
      const phoneNumber = normalizePhone(row['Phone Number'] || row['phone_number'] || row['phone'] || '');
      const sectorName = (row['Sector'] || row['sector'] || row['business_sector'] || '').trim();
      const productName = (row['Product'] || row['product'] || '').trim();

      if (!fullName) {
        errors.push({ row: rowNum, reason: 'Missing Full Name' });
        continue;
      }
      if (!phoneNumber) {
        errors.push({ row: rowNum, reason: 'Missing Phone Number' });
        continue;
      }
      if (existingPhones.has(phoneNumber)) {
        duplicates.push(phoneNumber);
        continue;
      }

      // Match sector by name (case-insensitive), fall back to default
      const matchedSector = sectorName
        ? allSectors.find((s) => s.name.toLowerCase() === sectorName.toLowerCase())
        : null;
      const sectorId = matchedSector?.id || defaultSector.id;

      // Match product by name (case-insensitive), optional
      const matchedProduct = productName
        ? allProducts.find((p) => p.name.toLowerCase() === productName.toLowerCase())
        : null;

      leadsToCreate.push({
        fullName,
        phoneNumber,
        sectorId,
        campaignId: pool.campaignId,
        leadPoolId: pool.id,
        ...(matchedProduct ? { products: { connect: [{ id: matchedProduct.id }] } } : {}),
      });

      // Track phone to avoid intra-batch duplicates
      existingPhones.add(phoneNumber);
      imported.push(phoneNumber);
    }

    // Bulk create leads
    if (leadsToCreate.length > 0) {
      await Promise.all(
        leadsToCreate.map((data) =>
          prisma.lead.create({
            data: {
              fullName: data.fullName,
              phoneNumber: data.phoneNumber,
              sectorId: data.sectorId,
              campaignId: data.campaignId,
              leadPoolId: data.leadPoolId,
              ...(data.products ? { products: data.products } : {}),
            },
          })
        )
      );

      // Update campaign lead count
      await prisma.campaign.update({
        where: { id: pool.campaignId },
        data: { lead_count: { increment: leadsToCreate.length } },
      });
    }

    return NextResponse.json({
      message: 'Upload complete',
      summary: {
        imported: imported.length,
        duplicates: duplicates.length,
        errors: errors.length,
        errorDetails: errors,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading leads:', error);
    return NextResponse.json({ error: 'Failed to upload leads' }, { status: 500 });
  }
});

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}
