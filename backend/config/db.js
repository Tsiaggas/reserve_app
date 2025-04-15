// Ρύθμιση για IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const { Pool } = require('pg');
const dotenv = require('dotenv');
const dns = require('dns');
const net = require('net');

// Εξαναγκάζουμε IPv4
dns.setDefaultResultOrder('ipv4first');

// Φόρτωση env
dotenv.config();

console.log('--------- ΔΙΑΓΝΩΣΤΙΚΑ ΣΥΝΔΕΣΗΣ ---------');

// Παραποίηση του net module για IPv4
try {
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function(options, ...args) {
    if (typeof options === 'object' && !options.family) {
      options.family = 4; // Επιλογή IPv4
      console.log('Επιβολή IPv4 για net.Socket.connect');
    }
    return originalConnect.apply(this, [options, ...args]);
  };
  console.log('Επιτυχής παραποίηση του Socket.connect');
} catch (e) {
  console.error('Αποτυχία παραποίησης του net module:', e);
}

// Ελέγχουμε πρώτα το PG_CONNECTION_STRING
let connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL;
console.log('Αρχικό connection string:', connectionString ? 
  `${connectionString.substring(0, 35)}...` : 'Μη ορισμένο');

// Διόρθωση του connection string για να εξασφαλίσουμε IPv4
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
}

console.log('Τελικό connection string:', connectionString ? 
  `${connectionString.substring(0, 35)}...` : 'Μη ορισμένο');

// Απευθείας ρύθμιση για το pg module
process.env.PGSSLMODE = 'require';

// Δημιουργία σύνδεσης με τη PostgreSQL βάση δεδομένων
const poolConfig = {
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Απαραίτητο για το Supabase
  },
  keepAlive: true, // Διατήρηση ζωντανής σύνδεσης
  connectionTimeoutMillis: 10000, // 10 δευτερόλεπτα
  idleTimeoutMillis: 30000,
  max: 20, // Μέγιστος αριθμός συνδέσεων
  allowExitOnIdle: false,
  // Αναγκαστική χρήση IPv4
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // Ειδικές ρυθμίσεις για Railway
  application_name: 'restaurant_reservation_app',
  options: `--client-min-messages=warning`,
};

// Αφαιρούμε ευαίσθητα δεδομένα πριν την εκτύπωση
const safeConfig = { ...poolConfig };
if (safeConfig.connectionString) safeConfig.connectionString = '***SECRET***';
if (safeConfig.password) safeConfig.password = '***SECRET***';
console.log('Ρυθμίσεις pool:', JSON.stringify(safeConfig, null, 2));

// Εφαρμογή ρυθμίσεων IPv4 για όλες τις συνδέσεις TCP
const originalCreateConnection = net.createConnection;
net.createConnection = function() {
  const args = Array.from(arguments);
  if (args[0] && typeof args[0] === 'object') {
    args[0].family = 4;
  }
  return originalCreateConnection.apply(this, args);
};

// Δημιουργία του pool
const pool = new Pool(poolConfig);

// Καταγραφή σφαλμάτων σύνδεσης
pool.on('error', (err) => {
  console.error('Σφάλμα στο pool PostgreSQL:', err);
  if (err.code === 'ENETUNREACH' || err.code === 'ENOTFOUND') {
    console.error('ΚΡΙΣΙΜΟ: Πρόβλημα δικτύου! Δοκιμάστε εναλλακτική σύνδεση.');
  }
});

// Μέθοδος ξεκινήματος νέας σύνδεσης
pool.on('connect', () => {
  console.log('Νέα σύνδεση PostgreSQL δημιουργήθηκε');
});

// Wrapper method για συμβατότητα με το υπάρχον κώδικα
const query = async (text, params) => {
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
      console.error('ΚΡΙΣΙΜΟ: Το σφάλμα είναι ENETUNREACH.');
      console.error('1. Το Railway χρησιμοποιεί IPv6 αλλά η βάση επιτρέπει μόνο IPv4');
      console.error('2. Προσπαθήστε να ενεργοποιήσετε IPv6 στη βάση δεδομένων');
      console.error('3. Επικοινωνήστε με την υποστήριξη του Railway');
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

module.exports = { pool, testConnection, query }; 