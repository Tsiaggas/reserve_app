/**
 * Workaround για το πρόβλημα ENETUNREACH με IPv6 στο Railway
 * Αυτό το αρχείο πρέπει να φορτωθεί πριν από οποιαδήποτε άλλη λειτουργία
 */

console.log('Φόρτωση network-workaround.js για επίλυση προβλήματος IPv6...');

// Ρύθμιση DNS για IPv4
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Ρύθμιση της μεταβλητής περιβάλλοντος για IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// Monkey patch του net module για να αποτρέψει το IPv6
try {
  const net = require('net');
  const originalCreateConnection = net.createConnection;
  
  net.createConnection = function(options, ...args) {
    // Επιβολή family=4 για IPv4
    if (typeof options === 'object') {
      options.family = 4;
    }
    return originalCreateConnection.call(this, options, ...args);
  };
  
  console.log('Επιτυχές monkey patch του net.createConnection για IPv4');
} catch (err) {
  console.error('Αποτυχία monkey patch του net module:', err);
}

// Patch του pg module αν υπάρχει
try {
  // Απενεργοποίηση της επαναφοράς σε IPv6
  process.env.PGSSLMODE = 'require';
  console.log('Ορισμός PGSSLMODE=require για σύνδεση PostgreSQL');
} catch (err) {
  console.error('Σφάλμα ρύθμισης pg:', err);
}

console.log('Network-workaround φορτώθηκε με επιτυχία!');

module.exports = { loaded: true }; 