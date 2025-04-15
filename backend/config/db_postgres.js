const { Pool } = require('pg');
const dotenv = require('dotenv');

// Φόρτωση των μεταβλητών περιβάλλοντος από το .env.supabase
dotenv.config({ path: '.env.supabase' });

// Ρύθμιση του χρόνου σύνδεσης
const connectionTimeoutMs = 5000;

// Εμφάνιση πληροφοριών για το DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('Χρησιμοποιείται το DATABASE_URL από τις μεταβλητές περιβάλλοντος');
} else {
  console.warn('ΠΡΟΣΟΧΗ: Δεν έχει οριστεί το DATABASE_URL. Ελέγξτε το αρχείο .env.supabase');
}

// Δημιουργία του pool σύνδεσης
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_REQUIRES_SSL === 'true' ? 
    { rejectUnauthorized: false } : false,
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

// Εκτέλεση ελέγχου σύνδεσης κατά την εκκίνηση
testConnection();

module.exports = {
  query,
  testConnection,
  pool
}; 