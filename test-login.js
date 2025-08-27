// Simple test script to check login API
const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('JSON Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Text Response:', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
