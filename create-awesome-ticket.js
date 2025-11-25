/**
 * Script to create an awesome ticket for NEBULA SUPPLY
 * Run with: node create-awesome-ticket.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

const awesomeTicket = {
  subject: '🚀 VIP Bestellung: Limited Edition Sneaker Drop - Dringende Anfrage',
  summary: `Hallo NEBULA SUPPLY Team,

ich bin ein langjähriger VIP-Kunde und habe eine wirklich wichtige Anfrage bezüglich des kommenden Limited Edition Sneaker Drops.

**Meine Situation:**
- Ich bin seit über 2 Jahren Stammkunde bei euch
- Habe bereits über 50 Paar Sneaker bei euch gekauft
- Bin Mitglied im VIP-Programm
- Habe immer pünktlich bezahlt und war sehr zufrieden

**Meine Anfrage:**
Ich habe gehört, dass ihr nächste Woche einen exklusiven Drop für die neuen Air Jordan 1 "Nebula Edition" plant. Diese sind limitiert auf nur 100 Paare weltweit!

Könntet ihr mir bitte folgende Informationen geben:
1. Gibt es eine VIP-Pre-Order Möglichkeit?
2. Kann ich mir ein Paar reservieren lassen?
3. Welche Zahlungsmethoden werden akzeptiert?
4. Wann genau ist der Drop-Termin?

**Warum das wichtig ist:**
Ich plane, diese Sneaker als Geschenk für meinen besten Freund zu kaufen, der ein riesiger Sneaker-Enthusiast ist. Sein Geburtstag ist in 3 Wochen und das wäre das perfekte Geschenk!

**Zusätzliche Info:**
- Ich bin bereit, auch einen Aufpreis für die Reservierung zu zahlen
- Kann sofort mit der Zahlung beginnen
- Bin flexibel bei der Abholung/Versand

Bitte meldet euch schnellstmöglich bei mir. Das wäre wirklich mega!

Vielen Dank im Voraus!
Best regards,
Maximilian "SneakerHead" Schmidt

P.S.: Falls ihr noch andere exklusive Drops plant, lasst es mich wissen! 🎯`,
  priority: 'high',
  category: 'feature', // Using 'feature' which is now supported
  tags: ['vip', 'sneaker-drop', 'limited-edition', 'pre-order', 'urgent', 'exclusive']
};

async function createTicket() {
  try {
    console.log('🚀 Creating awesome ticket...\n');
    console.log('📋 Ticket Details:');
    console.log(`   Subject: ${awesomeTicket.subject}`);
    console.log(`   Priority: ${awesomeTicket.priority}`);
    console.log(`   Category: ${awesomeTicket.category}`);
    console.log(`   Tags: ${awesomeTicket.tags.join(', ')}\n`);

    const response = await fetch(`${API_BASE_URL}/api/tickets/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(awesomeTicket)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Ticket erfolgreich erstellt!\n');
      console.log('🎫 Ticket Information:');
      console.log(`   ID: ${result.data.id}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Erstellt am: ${new Date(result.data.createdAt).toLocaleString('de-DE')}`);
      console.log(`   Channel: ${result.data.channel || 'web'}\n`);
      console.log('🎉 Das Ticket ist jetzt im Admin-Dashboard sichtbar!');
      return result.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Tickets:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('\n💡 Tipp: Stelle sicher, dass der API-Server läuft:');
      console.error('   - API URL:', API_BASE_URL);
      console.error('   - Starte den Server mit: npm run dev (im api-server Verzeichnis)');
    }
    process.exit(1);
  }
}

// Run the script
createTicket();

