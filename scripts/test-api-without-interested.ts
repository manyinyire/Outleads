import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIWithoutInterested() {
  try {
    console.log('Testing API by temporarily removing INTERESTED status leads...\n');
    
    // First, let's see what we have
    const allLeads = await prisma.lead.findMany({
      select: { id: true, fullName: true, status: true }
    });
    
    console.log('Current leads:');
    allLeads.forEach(lead => {
      console.log(`- ${lead.fullName}: ${lead.status}`);
    });
    
    // Update INTERESTED leads to NEW temporarily
    const interestedLeads = await prisma.lead.findMany({
      where: { status: 'INTERESTED' }
    });
    
    console.log(`\nFound ${interestedLeads.length} INTERESTED leads. Converting to NEW...`);
    
    await prisma.lead.updateMany({
      where: { status: 'INTERESTED' },
      data: { status: 'NEW' }
    });
    
    console.log('Updated INTERESTED leads to NEW status');
    
    // Now test the API logic
    console.log('\nTesting API query...');
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });
    
    console.log(`✓ API query successful! Found ${leads.length} leads`);
    
    // Transform like the API does
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
    
    console.log(`✓ Transformation successful! ${transformedLeads.length} leads transformed`);
    
    const leadsWithProducts = transformedLeads.filter(lead => lead.products.length > 0);
    console.log(`✓ Leads with products: ${leadsWithProducts.length}`);
    
    leadsWithProducts.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.name} - ${lead.products.map((p: any) => p.name).join(', ')}`);
    });
    
    // Restore the INTERESTED status
    console.log('\nRestoring INTERESTED status...');
    for (const lead of interestedLeads) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'INTERESTED' }
      });
    }
    console.log('✓ INTERESTED status restored');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIWithoutInterested();