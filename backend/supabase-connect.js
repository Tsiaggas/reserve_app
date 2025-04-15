/**
 * Εναλλακτική μέθοδος σύνδεσης με Supabase μέσω HTTP API
 * Καθώς η άμεση σύνδεση με pg client έχει προβλήματα με το IPv6 στο Railway
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Φόρτωση των μεταβλητών περιβάλλοντος
try {
  const envPath = path.resolve(__dirname, '.env.supabase');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (e) {
  console.error('Σφάλμα φόρτωσης περιβάλλοντος:', e);
  dotenv.config();
}

// Συνάρτηση για κρυπτογράφηση του connectionString
function maskPassword(str) {
  if (!str) return 'undefined';
  return str.replace(/(postgres|postgresql):\/\/[^:]+:([^@]+)@/, (match, proto, pass) => {
    return `${proto}://[USER]:[MASKED_PASSWORD]@`;
  });
}

// Extracts host and credentials from URL
function parseConnectionString(connectionString) {
  if (!connectionString) return null;
  
  try {
    // Extract parts with regex
    const regex = /^(?:postgres|postgresql):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      console.error('Μη έγκυρο connection string');
      return null;
    }
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
      ssl: connectionString.includes('sslmode=require')
    };
  } catch (error) {
    console.error('Σφάλμα ανάλυσης connection string:', error);
    return null;
  }
}

// Δοκιμαστική σύνδεση μέσω HTTP για να επαληθευτεί η συνδεσιμότητα
async function testHttpConnection() {
  const connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL;
  console.log('Δοκιμή HTTP σύνδεσης με:', maskPassword(connectionString));
  
  if (!connectionString) {
    console.error('Δεν βρέθηκε connection string');
    return false;
  }
  
  const dbInfo = parseConnectionString(connectionString);
  if (!dbInfo) {
    console.error('Αδυναμία ανάλυσης του connection string');
    return false;
  }
  
  // Δοκιμή σύνδεσης με το host του Supabase μέσω HTTPS
  return new Promise((resolve) => {
    console.log(`Δοκιμή σύνδεσης στο ${dbInfo.host} μέσω HTTPS...`);
    
    const req = https.request({
      host: dbInfo.host,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
      family: 4 // Επιβολή IPv4
    }, (res) => {
      console.log(`HTTPS σύνδεση επιτυχής! Κωδικός: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.error('Σφάλμα HTTPS σύνδεσης:', err);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error('Λήξη χρονικού ορίου σύνδεσης');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Άμεση δοκιμή της σύνδεσης HTTP
testHttpConnection().then(success => {
  if (success) {
    console.log('Η σύνδεση HTTP στο Supabase είναι εφικτή!');
    console.log('Αν η βάση δεδομένων εξακολουθεί να μην συνδέεται, το πρόβλημα είναι με το PostgreSQL port');
  } else {
    console.error('Η σύνδεση HTTP στο Supabase ΔΕΝ είναι εφικτή!');
    console.error('Αυτό δείχνει πρόβλημα στο επίπεδο δικτύου - ελέγξτε τις ρυθμίσεις δικτύου στο Railway');
  }
}).catch(err => {
  console.error('Εξαίρεση κατά τη δοκιμή HTTP σύνδεσης:', err);
});

module.exports = { testHttpConnection }; 