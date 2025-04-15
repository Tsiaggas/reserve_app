// Διαγνωστικό script για έλεγχο σύνδεσης με PostgreSQL
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Φόρτωση των μεταβλητών περιβάλλοντος από το .env.supabase
dotenv.config({ path: '.env.supabase' });

console.log('=== ΔΙΑΓΝΩΣΤΙΚΟ ΣΥΝΔΕΣΗΣ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Ορίστηκε' : 'ΔΕΝ ορίστηκε');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

async function testConnection() {
  try {
    console.log('Προσπάθεια σύνδεσης...');
    const client = await pool.connect();
    console.log('ΕΠΙΤΥΧΙΑ: Συνδέθηκε στη βάση');
    
    const res = await client.query('SELECT NOW() as time');
    console.log('Τρέχουσα ώρα βάσης:', res.rows[0].time);
    
    console.log('Προσπάθεια ανάκτησης πίνακα users...');
    const usersRes = await client.query('SELECT COUNT(*) FROM users');
    console.log('Αριθμός χρηστών:', usersRes.rows[0].count);
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  }
}

testConnection(); 