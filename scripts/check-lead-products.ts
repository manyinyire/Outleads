import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLeadProducts() {
  try {
    console.log('Checking leads and their interested products...');
    
    // Get all leads with their products
    const leads = await prisma.lead.findMany({
      include: {
        products: true,
        businessSector: true,
        campaign: true,
      },
    });
    
    console.log(`Found ${leads.length} total leads:`);
    
    leads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.fullName}`);
      console.log(`   Status: ${lead.status}`);
      console.log(`   Sector: ${lead.businessSector?.name}`);
      console.log(`   Products: ${lead.products.length > 0 ? lead.products.map(p => p.name).join(', ') : 'None selected'}`);
      console.log(`   Campaign: ${lead.campaign?.name || 'None'}`);
    });
    
    // Check if any leads have products
    const leadsWithProducts = leads.filter(lead => lead.products.length > 0);
    const leadsWithoutProducts = leads.filter(lead => lead.products.length === 0);
    
    console.log(`\nSummary:`);
    console.log(`- Leads with products: ${leadsWithProducts.length}`);
    console.log(`- Leads without products: ${leadsWithoutProducts.length}`);
    
    // Show available products
    const allProducts = await prisma.product.findMany();
    console.log(`\nAvailable products in database: ${allProducts.length}`);
    allProducts.forEach(product => {
      console.log(`- ${product.name} (${product.category})`);
    });
    
  } catch (error) {
    console.error('Error checking lead products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadProducts();