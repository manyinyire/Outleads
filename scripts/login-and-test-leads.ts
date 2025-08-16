async function loginAndTestLeads() {
  try {
    console.log('Step 1: Logging in...\n');
    
    // First, login to get authentication
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'test123'
      }),
      credentials: 'include' // Important for cookies
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.log('Login failed:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.message);
    
    // Extract cookies from login response
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);
    
    console.log('\nStep 2: Testing admin leads API...\n');
    
    // Now test the admin leads API with the session
    const leadsResponse = await fetch('http://localhost:3000/api/admin/leads', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include the cookie if we got one
        ...(setCookieHeader ? { 'Cookie': setCookieHeader.split(';')[0] } : {})
      },
      credentials: 'include'
    });
    
    console.log('Leads response status:', leadsResponse.status);
    
    if (!leadsResponse.ok) {
      const errorText = await leadsResponse.text();
      console.log('Leads API error:', errorText);
    } else {
      const leadsData = await leadsResponse.json();
      console.log('Success! Received leads data:');
      console.log(`- Total leads: ${Array.isArray(leadsData) ? leadsData.length : 'Not an array'}`);
      
      if (Array.isArray(leadsData) && leadsData.length > 0) {
        const leadsWithProducts = leadsData.filter((lead: any) => lead.products && lead.products.length > 0);
        console.log(`- Leads with products: ${leadsWithProducts.length}`);
        
        leadsWithProducts.forEach((lead: any, index: number) => {
          console.log(`  ${index + 1}. ${lead.name} - ${lead.products.map((p: any) => p.name).join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

loginAndTestLeads();