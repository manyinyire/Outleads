import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('--- Deleting Data ---');
    await prisma.lead.deleteMany({});
    console.log('Leads deleted.');
    await prisma.product.deleteMany({});
    console.log('Products deleted.');
    await prisma.productCategory.deleteMany({});
    console.log('ProductCategories deleted.');
    await prisma.sector.deleteMany({});
    console.log('Sectors deleted.');
    await prisma.campaign.deleteMany({});
    console.log('Campaigns deleted.');
    await prisma.user.deleteMany({});
    console.log('Users deleted.');
    console.log('--- Data Deletion Complete ---');

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

    console.log('--- Creating Sectors ---');
    for (const sector of sectors) {
      await prisma.sector.create({ data: sector });
      console.log(`Created sector: ${sector.name}`);
    }
    console.log('--- Sector Creation Complete ---');

    // Create product categories and products
    const productData = {
      "Bank Accounts": ["Individual Account", "Company Account"],
      "Motor Insurance": ["Comprehensive", "Third Party", "Passenger Insurance"],
      "Micro Insurance": ["Health Cash Plan", "Funeral Cash Plan"],
      "Business & Agriculture": ["Assets All Risks", "Goods in Transit", "Crop Insurance", "Livestock Insurance"],
      "Personal Loan": ["Borehole Loan", "Car Loan", "School Fees"],
      "Credit Cards": ["Mastercard", "Visacard"]
    };

    console.log('--- Creating Products & Categories ---');
    for (const categoryName in productData) {
      const category = await prisma.productCategory.create({
        data: { name: categoryName }
      });
      console.log(`Created category: ${category.name}`);

      const products = productData[categoryName as keyof typeof productData].map(productName => ({
        name: productName,
        categoryId: category.id
      }));

      await prisma.product.createMany({
        data: products
      });
      console.log(`-- Created ${products.length} products for ${category.name}`);
    }
    console.log('--- Product & Category Creation Complete ---');

    // Create the superuser
    const superuserPassword = await hashPassword('superuser123!');
    
    console.log('--- Creating Superuser ---');
    const superuser = await prisma.user.create({
      data: {
        email: 'superuser@fbc.co.zw',
        username: 'superuser',
        password: superuserPassword,
        name: 'Super User',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const
      }
    });
    console.log('Superuser created.');
    console.log('--- Superuser Creation Complete ---');

    // Create a sample campaign
    console.log('--- Creating Sample Campaign ---');
    const campaign = await prisma.campaign.create({
      data: {
        campaign_name: 'Q3 2025 Marketing Push',
        organization_name: 'Nexus Financial Services',
        createdById: superuser.id,
        uniqueLink: 'q3-2025-promo',
        click_count: 42,
        is_active: true,
      }
    });
    console.log('Sample campaign created.');
    console.log('--- Sample Campaign Creation Complete ---');

    // Create sample leads
    console.log('--- Creating Sample Leads ---');
    const techSector = await prisma.sector.findFirst({ where: { name: 'Technology' } });
    const financeSector = await prisma.sector.findFirst({ where: { name: 'Finance' } });
    const personalLoanProduct = await prisma.product.findFirst({ where: { name: 'Personal Loan' } });
    const creditCardProduct = await prisma.product.findFirst({ where: { name: 'Credit Cards' } });

    if (techSector && financeSector && personalLoanProduct && creditCardProduct) {
      const lead1 = await prisma.lead.create({
        data: {
          fullName: 'Alice Johnson',
          phoneNumber: '123-456-7890',
          sectorId: techSector.id,
          campaignId: campaign.id,
        }
      });
      const lead2 = await prisma.lead.create({
        data: {
          fullName: 'Bob Williams',
          phoneNumber: '234-567-8901',
          sectorId: financeSector.id,
          campaignId: campaign.id,
        }
      });
      console.log('Created 2 sample leads.');

      // Associate products with leads
      await prisma.lead.update({
        where: { id: lead1.id },
        data: {
          products: {
            connect: [{ id: personalLoanProduct.id }, { id: creditCardProduct.id }]
          }
        }
      });
      console.log('Associated products with Alice Johnson.');
    } else {
      console.warn('Could not find necessary sectors or products to create full sample leads.');
    }
    console.log('--- Sample Lead Creation Complete ---');

    console.log('✅ Database seeded successfully!');
    console.log('Superuser Created:');
    console.log('Email: superuser@fbc.co.zw');
    console.log('Password: superuser123!');

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
