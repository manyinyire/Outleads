// Quick test script to verify API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  const endpoints = [
    '/api/products',
    '/api/sectors',
    '/api/health'
  ];
  
  console.log('Testing API endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Network Error: ${error.message}`);
    }
    console.log('');
  }
};

// Run the test
testEndpoints().catch(console.error);
