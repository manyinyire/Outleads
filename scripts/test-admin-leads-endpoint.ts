async function testAdminLeadsEndpoint() {
  try {
    console.log('Testing admin leads API endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/leads', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials for cookie-based auth
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', errorJson);
      } catch (e) {
        console.log('Could not parse error as JSON');
      }
    } else {
      const data = await response.json();
      console.log('Success! Received data:');
      console.log(`- Total leads: ${Array.isArray(data) ? data.length : 'Not an array'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('- Sample lead:', JSON.stringify(data[0], null, 2));
        
        const leadsWithProducts = data.filter((lead: any) => lead.products && lead.products.length > 0);
        console.log(`- Leads with products: ${leadsWithProducts.length}`);
        
        leadsWithProducts.forEach((lead: any, index: number) => {
          console.log(`  ${index + 1}. ${lead.name} - ${lead.products.map((p: any) => p.name).join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
}

testAdminLeadsEndpoint();