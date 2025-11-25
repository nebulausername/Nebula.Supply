/**
 * Debug script to check if tickets are in the database and returned by API
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function checkTickets() {
  try {
    console.log('🔍 Checking tickets...\n');
    
    // Try to get tickets without auth (should fail but show us the error)
    console.log('1. Testing API endpoint without auth...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const text = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text.substring(0, 200)}...\n`);
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    // Try with test endpoint (no auth needed)
    console.log('2. Checking if test endpoint works...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Test Check Ticket',
          summary: 'This is a test to check if tickets are working',
          priority: 'low',
          category: 'other'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Test endpoint works!`);
        console.log(`   Created ticket: ${result.data?.id}\n`);
      } else {
        const text = await response.text();
        console.log(`   ❌ Test endpoint failed: ${response.status}`);
        console.log(`   Response: ${text.substring(0, 200)}...\n`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('💡 Tipp: Stelle sicher, dass:');
    console.log('   - Der API-Server läuft (Port 3001)');
    console.log('   - Du im Admin-Dashboard eingeloggt bist');
    console.log('   - Die Filter im Dashboard keine Tickets herausfiltern');
    console.log('   - Der Browser-Cache geleert wurde (Strg+Shift+R)');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

checkTickets();

