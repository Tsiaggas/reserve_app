// Ρύθμιση για IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const { Pool } = require('pg');
const dotenv = require('dotenv');
const dns = require('dns');

// Εξαναγκάζουμε IPv4
dns.setDefaultResultOrder('ipv4first');

// Φόρτωση env
dotenv.config();

console.log('--------- ΔΙΑΓΝΩΣΤΙΚΑ ΣΥΝΔΕΣΗΣ ---------');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
  `${process.env.DATABASE_URL.substring(0, 35)}...` : 'Μη ορισμένο');

// Διόρθωση του connection string για να εξασφαλίσουμε IPv4
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  // Προσθήκη των παραμέτρων IPv4 και SSL αν λείπουν
  if (!connectionString.includes('?')) {
    connectionString += '?sslmode=require&ipversion=4';
  } else if (!connectionString.includes('ipversion=4')) {
    connectionString += '&ipversion=4';
  }
  if (!connectionString.includes('sslmode=')) {
    connectionString += '&sslmode=require';
  }
  console.log('Τελικό connectionString:', 
    `${connectionString.substring(0, 35)}...`);
}

// Δημιουργία σύνδεσης με τη PostgreSQL βάση δεδομένων
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Απαραίτητο για το Supabase
  },
  keepAlive: true, // Διατήρηση ζωντανής σύνδεσης
  connectionTimeoutMillis: 10000, // 10 δευτερόλεπτα
});

// Καταγραφή σφαλμάτων σύνδεσης
pool.on('error', (err) => {
  console.error('Σφάλμα στο pool PostgreSQL:', err);
});

// Wrapper method για συμβατότητα με το υπάρχον κώδικα
pool.query = async (text, params) => {
  try {
    console.log('Εκτέλεση ερωτήματος:', text);
    const result = await pool.query(text, params);
    // Επιστροφή σε μορφή παρόμοια με mysql2 για συμβατότητα
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Σφάλμα εκτέλεσης ερωτήματος:', error);
    throw error;
  }
};

// Δοκιμή σύνδεσης
const testConnection = async () => {
  console.log('Δοκιμή σύνδεσης PostgreSQL...');
  try {
    const client = await pool.connect();
    console.log('ΕΠΙΤΥΧΗΣ ΣΥΝΔΕΣΗ στη βάση δεδομένων PostgreSQL!');
    
    // Δοκιμαστικό ερώτημα
    try {
      const result = await client.query('SELECT NOW() as time');
      console.log('Τρέχουσα ώρα βάσης:', result.rows[0].time);
    } catch (queryErr) {
      console.error('Σφάλμα δοκιμαστικού ερωτήματος:', queryErr);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ στη βάση δεδομένων:', error);
    if (error.code === 'ENETUNREACH') {
      console.error('Το σφάλμα είναι ENETUNREACH. Δοκιμάστε:');
      console.error('1. Χρήση IPv4 αντί για IPv6');
      console.error('2. Έλεγχος ότι το Supabase επιτρέπει συνδέσεις από παντού');
    }
    return false;
  }
};

// Άμεση δοκιμή σύνδεσης κατά το φόρτωμα του module
setTimeout(() => {
  console.log('Εκτέλεση δοκιμαστικής σύνδεσης...');
  testConnection().catch(err => {
    console.error('Αδυναμία εκτέλεσης testConnection:', err);
  });
}, 1000);

console.log('--------- ΤΕΛΟΣ ΔΙΑΓΝΩΣΤΙΚΩΝ ---------');

module.exports = { pool, testConnection }; 