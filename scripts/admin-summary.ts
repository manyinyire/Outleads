import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateAdminSummary() {
  try {
    console.log('=== ADMIN LEADS SUMMARY ===\n');
    
    // Get all leads as the admin API would
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });

    const transformedLeads = leads.map((lead: any) => ({
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

    console.log(`Total leads in system: ${transformedLeads.length}\n`);
    
    // Group by status
    const statusGroups = transformedLeads.reduce((acc: any, lead) => {
      if (!acc[lead.status]) acc[lead.status] = [];
      acc[lead.status].push(lead);
      return acc;
    }, {});
    
    Object.keys(statusGroups).forEach(status => {
      console.log(`${status} leads: ${statusGroups[status].length}`);
      statusGroups[status].forEach((lead: any, index: number) => {
        const productNames = lead.products.map((p: any) => p.name).join(', ');
        console.log(`  ${index + 1}. ${lead.name} - Products: ${productNames || 'None'}`);
      });
      console.log('');
    });
    
    // Leads with interested products
    const leadsWithProducts = transformedLeads.filter(lead => lead.products.length > 0);
    console.log(`\n=== LEADS WITH INTERESTED PRODUCTS (${leadsWithProducts.length}) ===`);
    leadsWithProducts.forEach((lead, index) => {
      const productNames = lead.products.map((p: any) => p.name).join(', ');
      console.log(`${index + 1}. ${lead.name} (${lead.status})`);
      console.log(`   Company: ${lead.company}`);
      console.log(`   Products: ${productNames}`);
      console.log(`   Phone: ${lead.phone}`);
      console.log('');
    });
    
    if (leadsWithProducts.length === 0) {
      console.log('No leads have selected interested products yet.');
      console.log('This could mean:');
      console.log('1. No one has submitted the form with product selections');
      console.log('2. The leads were created through other means (seed scripts, etc.)');
      console.log('3. There might be an issue with the form submission process');
    }
    
  } catch (error) {
    console.error('Error generating admin summary:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateAdminSummary();