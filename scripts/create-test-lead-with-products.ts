import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestLeadWithProducts() {
  try {
    console.log('Creating a test lead with multiple products...');
    
    // Get some existing products
    const products = await prisma.product.findMany({
      where: {
        name: {
          in: ['CRM Software', 'Financial Planning', 'Marketing Automation']
        }
      }
    });
    
    if (products.length === 0) {
      console.log('No matching products found. Available products:');
      const allProducts = await prisma.product.findMany();
      allProducts.slice(0, 5).forEach(p => console.log(`- ${p.name}`));
      return;
    }
    
    // Get a sector
    const sector = await prisma.sector.findFirst();
    if (!sector) {
      console.log('No sectors found');
      return;
    }
    
    // Create a test lead with multiple products
    const lead = await prisma.lead.create({
      data: {
        fullName: 'Test User With Products',
        email: 'test@example.com',
        phoneNumber: '+1-555-TEST',
        sectorId: sector.id,
        status: 'NEW',
        products: {
          connect: products.map(p => ({ id: p.id }))
        }
      },
      include: {
        products: true,
        businessSector: true,
      }
    });
    
    console.log(`Created lead: ${lead.fullName}`);
    console.log(`Products: ${lead.products.map(p => p.name).join(', ')}`);
    console.log(`Sector: ${lead.businessSector?.name}`);
    
    // Test the transformation
    const transformed = {
      id: lead.id,
      name: lead.fullName,
      email: lead.email || 'N/A',
      phone: lead.phoneNumber,
      company: lead.businessSector?.name || 'N/A',
      products: lead.products || [],
      campaign: null,
      status: lead.status,
      createdAt: lead.createdAt,
    };
    
    console.log('\nTransformed data:');
    console.log(JSON.stringify(transformed, null, 2));
    
  } catch (error) {
    console.error('Error creating test lead:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLeadWithProducts();