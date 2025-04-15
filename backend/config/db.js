const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Δημιουργία σύνδεσης με τη PostgreSQL βάση δεδομένων
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false // Απαραίτητο για το Supabase
  }
});

// Wrapper method για συμβατότητα με το υπάρχον κώδικα
pool.query = async (text, params) => {
  const result = await pool.query(text, params);
  // Επιστροφή σε μορφή παρόμοια με mysql2 για συμβατότητα
  return [result.rows, result.fields];
};

// Δοκιμή σύνδεσης
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Επιτυχής σύνδεση στη βάση δεδομένων PostgreSQL');
    client.release();
    return true;
  } catch (error) {
    console.error('Σφάλμα σύνδεσης στη βάση δεδομένων:', error);
    return false;
  }
};

module.exports = { pool, testConnection }; 