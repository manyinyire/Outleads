import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminLeadsAPI() {
  try {
    console.log('Testing admin leads API logic...');
    
    // Simulate the same query as the admin API
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });

    // Transform the data exactly like the admin API does
    const transformedLeads = leads.map((lead: any) => ({
      id: lead.id,
      name: lead.fullName, // Map fullName to name
      email: lead.email || 'N/A',
      phone: lead.phoneNumber, // Map phoneNumber to phone
      company: lead.businessSector?.name || 'N/A', // Use sector as company
      products: lead.products || [],
      campaign: lead.campaign,
      status: lead.status, // Include status field
      createdAt: lead.createdAt,
    }));

    console.log(`Found ${transformedLeads.length} leads after transformation:`);
    
    transformedLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.name}`);
      console.log(`   Status: ${lead.status}`);
      console.log(`   Company: ${lead.company}`);
      console.log(`   Products: ${lead.products.length > 0 ? lead.products.map((p: any) => p.name).join(', ') : 'None'}`);
      console.log(`   Campaign: ${lead.campaign?.name || 'None'}`);
    });
    
    // Filter for leads with products (interested prospects)
    const interestedLeads = transformedLeads.filter(lead => lead.products.length > 0);
    console.log(`\nLeads with interested products: ${interestedLeads.length}`);
    
    interestedLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} - Products: ${lead.products.map((p: any) => p.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error testing admin leads API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLeadsAPI();