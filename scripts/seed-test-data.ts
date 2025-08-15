import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('Checking existing data...');
    
    // Check if we already have data
    const leadCount = await prisma.lead.count();
    const sectorCount = await prisma.sector.count();
    const productCount = await prisma.product.count();
    
    console.log(`Current counts - Leads: ${leadCount}, Sectors: ${sectorCount}, Products: ${productCount}`);
    
    // Create sectors if they don't exist
    if (sectorCount === 0) {
      console.log('Creating sectors...');
      await prisma.sector.createMany({
        data: [
          { name: 'Technology' },
          { name: 'Healthcare' },
          { name: 'Finance' },
          { name: 'Education' },
          { name: 'Retail' },
        ],
      });
    }
    
    // Create products if they don't exist
    if (productCount === 0) {
      console.log('Creating products...');
      await prisma.product.createMany({
        data: [
          { name: 'CRM Software', description: 'Customer Relationship Management', category: 'software' },
          { name: 'Financial Planning', description: 'Financial advisory services', category: 'finance' },
          { name: 'Marketing Automation', description: 'Automated marketing tools', category: 'marketing' },
        ],
      });
    }
    
    // Create test leads if none exist
    if (leadCount === 0) {
      console.log('Creating test leads...');
      
      const sectors = await prisma.sector.findMany();
      const products = await prisma.product.findMany();
      
      if (sectors.length > 0 && products.length > 0) {
        // Create some test leads
        const testLeads = [
          {
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+1-555-0101',
            sectorId: sectors[0].id,
          },
          {
            fullName: 'Jane Smith',
            email: 'jane.smith@example.com',
            phoneNumber: '+1-555-0102',
            sectorId: sectors[1].id,
          },
          {
            fullName: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            phoneNumber: '+1-555-0103',
            sectorId: sectors[2].id,
          },
        ];
        
        for (const leadData of testLeads) {
          const lead = await prisma.lead.create({
            data: leadData,
          });
          
          // Connect some products to the lead
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              products: {
                connect: [{ id: products[0].id }],
              },
            },
          });
        }
        
        console.log('Test leads created successfully!');
      }
    }
    
    // Final count
    const finalCounts = {
      leads: await prisma.lead.count(),
      sectors: await prisma.sector.count(),
      products: await prisma.product.count(),
    };
    
    console.log('Final counts:', finalCounts);
    
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();