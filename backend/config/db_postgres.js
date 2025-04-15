const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Φόρτωση των μεταβλητών περιβάλλοντος από το .env.supabase
try {
  const envPath = path.resolve(__dirname, '../.env.supabase');
  if (fs.existsSync(envPath)) {
    console.log('Φόρτωση μεταβλητών από:', envPath);
    dotenv.config({ path: envPath });
  } else {
    console.log('Το αρχείο .env.supabase δεν βρέθηκε, χρήση .env');
    dotenv.config();
  }
} catch (e) {
  console.error('Σφάλμα κατά τη φόρτωση περιβάλλοντος:', e);
  dotenv.config(); // Προσπαθούμε με το προεπιλεγμένο .env
}

// Ρύθμιση του χρόνου σύνδεσης
const connectionTimeoutMs = 5000;

// Εμφάνιση πληροφοριών για το DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL είναι ορισμένο:', process.env.DATABASE_URL.substring(0, 25) + '...');
} else {
  console.warn('ΠΡΟΣΟΧΗ: Δεν έχει οριστεί το DATABASE_URL. Ελέγξτε το αρχείο .env.supabase');
}

// Διόρθωση του DATABASE_URL αν χρειάζεται
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('!') || connectionString.includes('#')) {
  console.log('Εντοπίστηκαν ειδικοί χαρακτήρες στο URL, γίνεται κωδικοποίηση...');
  connectionString = connectionString
    .replace(/!/g, '%21')
    .replace(/#/g, '%23');
  console.log('Κωδικοποιημένο URL:', connectionString.substring(0, 25) + '...');
}

// Δημιουργία του pool σύνδεσης
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Πάντα false για το Supabase
  },
  connectionTimeoutMillis: connectionTimeoutMs,
});

// Εξαγωγή της μεθόδου ερωτημάτων
const query = (text, params) => {
  console.log(`Εκτέλεση ερωτήματος: ${text}`);
  return pool.query(text, params);
};

// Συνάρτηση για έλεγχο της σύνδεσης
const testConnection = async () => {
  console.log(`[${new Date().toISOString()}] Έλεγχος σύνδεσης με τη βάση δεδομένων...`);
  const startTime = Date.now();

  try {
    const client = await pool.connect();
    console.log(`[${new Date().toISOString()}] Επιτυχής σύνδεση με τη βάση δεδομένων (${Date.now() - startTime}ms)`);
    
    try {
      // Έλεγχος για πίνακα users
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`[${new Date().toISOString()}] Αριθμός χρηστών στη βάση: ${userCount.rows[0].count}`);
    } catch (tableError) {
      console.warn(`[${new Date().toISOString()}] Ο πίνακας users δεν υπάρχει ακόμα: ${tableError.message}`);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Σφάλμα σύνδεσης με τη βάση δεδομένων (${Date.now() - startTime}ms):`);
    console.error(`Μήνυμα: ${error.message}`);
    console.error(`Στοίβα: ${error.stack}`);
    return false;
  }
};

// Βασική δοκιμή σύνδεσης
console.log('Δοκιμή σύνδεσης με τη βάση δεδομένων...');
try {
  testConnection();
} catch (e) {
  console.error('Εξαίρεση κατά τη δοκιμή σύνδεσης:', e);
}

module.exports = {
  query,
  testConnection,
  pool
}; 