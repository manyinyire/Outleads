import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateAdminView() {
  try {
    console.log('=== SIMULATING ADMIN LEADS VIEW ===\n');
    
    // Simulate the exact API call the frontend makes
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });

    // Transform exactly like the API
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

    console.log('What you should see in the admin table:\n');
    console.log('Name'.padEnd(25) + 'Status'.padEnd(12) + 'Company'.padEnd(20) + 'Interested Products');
    console.log('-'.repeat(80));
    
    transformedLeads.forEach(lead => {
      const productNames = lead.products.map((p: any) => p.name).join(', ') || 'None';
      console.log(
        lead.name.padEnd(25) + 
        lead.status.padEnd(12) + 
        lead.company.padEnd(20) + 
        productNames
      );
    });
    
    console.log('\n=== FILTERING EXAMPLES ===');
    
    // Show what happens with different filters
    const statusFilters = ['NEW', 'INTERESTED', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];
    
    statusFilters.forEach(status => {
      const filtered = transformedLeads.filter(lead => lead.status === status);
      const withProducts = filtered.filter(lead => lead.products.length > 0);
      console.log(`${status}: ${filtered.length} total, ${withProducts.length} with products`);
    });
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. In the admin panel, clear all status filters to see all leads');
    console.log('2. Look at the "Interested Products" column - it should show blue tags');
    console.log('3. If you want to see only leads with products, you can search or manually filter');
    console.log('4. The leads with products are:');
    
    const leadsWithProducts = transformedLeads.filter(lead => lead.products.length > 0);
    leadsWithProducts.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.name} - ${lead.products.map((p: any) => p.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error simulating admin view:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAdminView();