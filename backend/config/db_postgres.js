const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

console.log('Προσπάθεια σύνδεσης στη βάση δεδομένων με DATABASE_URL');

// Δημιουργία σύνδεσης με τη PostgreSQL βάση δεδομένων
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Απαραίτητο για το Supabase
  },
  connectionTimeoutMillis: 10000, // 10 seconds
  statement_timeout: 10000 // 10 seconds
});

// Wrapper method για συμβατότητα με το υπάρχον κώδικα
const originalQuery = pool.query;
pool.query = async (text, params) => {
  try {
    console.log('Εκτέλεση ερωτήματος:', text);
    const result = await originalQuery.call(pool, text, params);
    // Επιστροφή σε μορφή παρόμοια με mysql2 για συμβατότητα
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Σφάλμα στην εκτέλεση ερωτήματος:', error);
    throw error;
  }
};

// Δοκιμή σύνδεσης
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Επιτυχής σύνδεση στη βάση δεδομένων PostgreSQL');
    const res = await client.query('SELECT NOW()');
    console.log('Αποτέλεσμα δοκιμαστικού ερωτήματος:', res.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('Σφάλμα σύνδεσης στη βάση δεδομένων:', error);
    return false;
  }
};

module.exports = { pool, testConnection }; 