import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAdminAPIError() {
  try {
    console.log('Testing admin leads API logic step by step...\n');
    
    // Step 1: Test basic database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    
    // Step 2: Test basic lead query without includes
    console.log('\n2. Testing basic lead query...');
    const basicLeads = await prisma.lead.findMany();
    console.log(`✓ Found ${basicLeads.length} leads`);
    
    // Step 3: Test with campaign include
    console.log('\n3. Testing with campaign include...');
    const leadsWithCampaign = await prisma.lead.findMany({
      include: {
        campaign: true,
      },
    });
    console.log(`✓ Found ${leadsWithCampaign.length} leads with campaign data`);
    
    // Step 4: Test with products include
    console.log('\n4. Testing with products include...');
    const leadsWithProducts = await prisma.lead.findMany({
      include: {
        products: true,
      },
    });
    console.log(`✓ Found ${leadsWithProducts.length} leads with products data`);
    
    // Step 5: Test with businessSector include
    console.log('\n5. Testing with businessSector include...');
    const leadsWithSector = await prisma.lead.findMany({
      include: {
        businessSector: true,
      },
    });
    console.log(`✓ Found ${leadsWithSector.length} leads with sector data`);
    
    // Step 6: Test full query like the API
    console.log('\n6. Testing full query like admin API...');
    const fullLeads = await prisma.lead.findMany({
      include: {
        campaign: true,
        products: true,
        businessSector: true,
      },
    });
    console.log(`✓ Found ${fullLeads.length} leads with all includes`);
    
    // Step 7: Test transformation
    console.log('\n7. Testing data transformation...');
    const transformedLeads = fullLeads.map((lead: any) => ({
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
    console.log(`✓ Transformed ${transformedLeads.length} leads successfully`);
    
    // Step 8: Test JSON serialization
    console.log('\n8. Testing JSON serialization...');
    const jsonString = JSON.stringify(transformedLeads);
    console.log(`✓ JSON serialization successful (${jsonString.length} characters)`);
    
    console.log('\n✅ All tests passed! The API logic should work fine.');
    console.log('The 500 error might be related to authentication or other middleware.');
    
  } catch (error) {
    console.error('\n❌ Error found:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminAPIError();