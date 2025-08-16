import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInterestedLeads() {
  try {
    console.log('Testing INTERESTED leads...');
    
    // Get all leads with INTERESTED status
    const interestedLeads = await prisma.lead.findMany({
      where: {
        status: 'INTERESTED'
      },
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });
    
    console.log(`Found ${interestedLeads.length} interested leads:`);
    
    interestedLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} (${lead.status}) - ${lead.businessSector?.name}`);
    });
    
    // Test the transformation (same as API)
    const transformedLeads = interestedLeads.map((lead: any) => ({
      id: lead.id,
      name: lead.fullName,
      email: lead.email || 'N/A',
      phone: lead.phoneNumber,
      company: lead.businessSector?.name || 'N/A',
      products: lead.products || [],
      campaign: lead.campaign,
      status: lead.status,
      createdAt: lead.createdAt,
    }));
    
    console.log('\nTransformed data sample:');
    console.log(JSON.stringify(transformedLeads[0], null, 2));
    
  } catch (error) {
    console.error('Error testing interested leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInterestedLeads();