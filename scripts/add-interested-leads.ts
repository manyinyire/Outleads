import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addInterestedLeads() {
  try {
    console.log('Adding leads with INTERESTED status...');
    
    // Get existing sectors and products
    const sectors = await prisma.sector.findMany();
    const products = await prisma.product.findMany();
    
    if (sectors.length === 0) {
      console.log('No sectors found. Please run the seed script first.');
      return;
    }
    
    // Create some test leads with INTERESTED status
    const interestedLeads = [
      {
        fullName: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phoneNumber: '+1-555-0201',
        sectorId: sectors[0].id,
        status: 'INTERESTED' as any,
      },
      {
        fullName: 'Mike Chen',
        email: 'mike.chen@example.com',
        phoneNumber: '+1-555-0202',
        sectorId: sectors[1].id,
        status: 'INTERESTED' as any,
      },
      {
        fullName: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@example.com',
        phoneNumber: '+1-555-0203',
        sectorId: sectors[2].id,
        status: 'INTERESTED' as any,
      },
    ];
    
    for (const leadData of interestedLeads) {
      const lead = await prisma.lead.create({
        data: leadData,
      });
      
      // Connect some products to the lead if products exist
      if (products.length > 0) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            products: {
              connect: [{ id: products[0].id }],
            },
          },
        });
      }
      
      console.log(`Created interested lead: ${lead.fullName}`);
    }
    
    // Show final counts by status
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });
    
    console.log('Lead counts by status:');
    statusCounts.forEach(({ status, _count }) => {
      console.log(`  ${status}: ${_count.status}`);
    });
    
  } catch (error) {
    console.error('Error adding interested leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addInterestedLeads();