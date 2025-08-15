import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/admin/users/export - Export users to CSV (Admin, BSS, InfoSec only)
export const GET = withAuthAndRole(['ADMIN', 'BSS', 'INFOSEC'], async (req: AuthenticatedRequest) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as any[];

    // Generate CSV content
    const csvHeaders = [
      'Username',
      'Name', 
      'Email',
      'SBU',
      'Role',
      'Status',
      'Created Date',
      'Last Login',
      'Campaigns Count'
    ];

    const csvRows = users.map(user => [
      user.username,
      user.name,
      user.email,
      user.sbu || 'N/A',
      user.role,
      user.status,
      user.createdAt.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never',
      user._count.campaigns.toString()
    ]);

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `nexus-users-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to export users'
    }, { status: 500 });
  }
});
