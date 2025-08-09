import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create default sectors
    const sectors = [
      { name: 'Technology' },
      { name: 'Healthcare' },
      { name: 'Finance' },
      { name: 'Education' },
      { name: 'Retail' },
      { name: 'Manufacturing' },
      { name: 'Real Estate' },
      { name: 'Hospitality' },
      { name: 'Transportation' },
      { name: 'Other' }
    ];

    console.log('Creating sectors...');
    for (const sector of sectors) {
      await prisma.sector.upsert({
        where: { id: `sector-${sector.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `sector-${sector.name.toLowerCase().replace(/\s+/g, '-')}`,
          ...sector
        }
      });
    }

    // Create default products
    const products = [
      {
        name: 'Business Loan',
        description: 'Flexible business loans for growth and expansion'
      },
      {
        name: 'Equipment Financing',
        description: 'Financing solutions for business equipment and machinery'
      },
      {
        name: 'Working Capital',
        description: 'Short-term financing for operational expenses'
      },
      {
        name: 'Commercial Real Estate',
        description: 'Loans for commercial property purchases and refinancing'
      },
      {
        name: 'Invoice Factoring',
        description: 'Convert outstanding invoices into immediate cash flow'
      },
      {
        name: 'Merchant Cash Advance',
        description: 'Quick funding based on future credit card sales'
      },
      {
        name: 'SBA Loans',
        description: 'Government-backed loans with favorable terms'
      },
      {
        name: 'Line of Credit',
        description: 'Flexible credit line for ongoing business needs'
      }
    ];

    console.log('Creating products...');
    for (const product of products) {
      await prisma.product.upsert({
        where: { id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
          ...product
        }
      });
    }

    // Create default admin user
    const adminPassword = await hashPassword('admin123!');
    
    console.log('Creating default admin user...');
    await prisma.user.upsert({
      where: { email: 'admin@nexus.com' },
      update: {},
      create: {
        email: 'admin@nexus.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN' as const
      }
    });

    // Create default agent user
    const agentPassword = await hashPassword('agent123!');
    
    console.log('Creating default agent user...');
    await prisma.user.upsert({
      where: { email: 'agent@nexus.com' },
      update: {},
      create: {
        email: 'agent@nexus.com',
        password: agentPassword,
        name: 'Agent User',
        role: 'AGENT' as const
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Default Users Created:');
    console.log('Admin: admin@nexus.com / admin123!');
    console.log('Agent: agent@nexus.com / agent123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
