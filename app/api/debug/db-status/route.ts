import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Get basic counts
    const userCount = await prisma.user.count();
    const sbuCount = await prisma.sbu.count();
    
    // Get a sample user if any exist
    const sampleUser = await prisma.user.findFirst({
      include: {
        sbu: true
      }
    });
    
    return NextResponse.json({
      status: 'connected',
      counts: {
        users: userCount,
        sbus: sbuCount,
      },
      sampleUser: sampleUser ? {
        id: sampleUser.id,
        username: sampleUser.username,
        name: sampleUser.name,
        role: sampleUser.role,
        status: sampleUser.status,
        sbu: sampleUser.sbu?.name || null,
      } : null,
      env: {
        devBypass: process.env.DEV_BYPASS_AUTH === 'true',
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        devBypass: process.env.DEV_BYPASS_AUTH === 'true',
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}