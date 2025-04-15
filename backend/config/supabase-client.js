/**
 * Supabase REST API Client
 * Εναλλακτική λύση για την απευθείας σύνδεση PostgreSQL που έχει πρόβλημα με το IPv6
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Έλεγχος και καταγραφή της τρέχουσας διεύθυνσης
console.log('-------- ΔΙΑΓΝΩΣΤΙΚΑ SUPABASE-CLIENT --------');
try {
  const dns = require('dns');
  dns.lookup('xsmychmezexlfspklacl.supabase.co', {all: true}, (err, addresses) => {
    if (err) {
      console.error('Σφάλμα DNS lookup:', err);
    } else {
      console.log('Διευθύνσεις για xsmychmezexlfspklacl.supabase.co:', addresses);
    }
  });
} catch (e) {
  console.error('Σφάλμα DNS check:', e);
}

// HARDCODED VALUES - ΠΡΟΣΩΡΙΝΗ ΛΥΣΗ
const SUPABASE_URL = 'https://xsmychmezexlfspklacl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbXljaG1lemV4bGZzcGtsYWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NDAyNDksImV4cCI6MjAzNDAxNjI0OX0._ULj1NOAkCh5BcCUfyjvqf9lh-qUAfYx7y7IbGKPMsM';

console.log('ΧΡΗΣΗ HARDCODED ΤΙΜΩΝ:');
console.log('URL:', SUPABASE_URL);
console.log('ANON KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined');

// Δημιουργία του Axios client για το Supabase με hardcoded τιμές
const supabase = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  timeout: 15000,
  // Ρυθμίσεις για IPv4
  family: 4,
  // Αποτροπή σφαλμάτων πιστοποιητικού
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Συναρτήσεις για αλληλεπίδραση με τον πίνακα users
const users = {
  async getById(id) {
    try {
      const response = await supabase.get(`/rest/v1/users?id=eq.${id}`);
      return response.data[0] || null;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης χρήστη:', error);
      throw error;
    }
  },
  
  async getByEmail(email) {
    try {
      const response = await supabase.get(`/rest/v1/users?email=eq.${encodeURIComponent(email)}`);
      return response.data[0] || null;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης χρήστη με email:', error);
      throw error;
    }
  },
  
  async create(userData) {
    try {
      const response = await supabase.post('/rest/v1/users', userData);
      return response.data;
    } catch (error) {
      console.error('Σφάλμα δημιουργίας χρήστη:', error);
      throw error;
    }
  }
};

// Συναρτήσεις για αλληλεπίδραση με τον πίνακα restaurants
const restaurants = {
  async getAll() {
    try {
      const response = await supabase.get('/rest/v1/restaurants');
      return response.data;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης εστιατορίων:', error);
      throw error;
    }
  },
  
  async getById(id) {
    try {
      const response = await supabase.get(`/rest/v1/restaurants?id=eq.${id}`);
      return response.data[0] || null;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης εστιατορίου:', error);
      throw error;
    }
  },
  
  async create(restaurantData) {
    try {
      const response = await supabase.post('/rest/v1/restaurants', restaurantData);
      return response.data;
    } catch (error) {
      console.error('Σφάλμα δημιουργίας εστιατορίου:', error);
      throw error;
    }
  }
};

// Συναρτήσεις για αλληλεπίδραση με τον πίνακα reservations
const reservations = {
  async getAll() {
    try {
      const response = await supabase.get('/rest/v1/reservations');
      return response.data;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης κρατήσεων:', error);
      throw error;
    }
  },
  
  async getByUserId(userId) {
    try {
      const response = await supabase.get(`/rest/v1/reservations?user_id=eq.${userId}`);
      return response.data;
    } catch (error) {
      console.error('Σφάλμα ανάκτησης κρατήσεων χρήστη:', error);
      throw error;
    }
  },
  
  async create(reservationData) {
    try {
      const response = await supabase.post('/rest/v1/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Σφάλμα δημιουργίας κράτησης:', error);
      throw error;
    }
  }
};

// Προσομοίωση του pool.query interface για συμβατότητα με υπάρχον κώδικα
const query = async (text, params) => {
  console.log('Εκτέλεση SQL μέσω REST API:', text);
  console.log('Παράμετροι:', params);
  
  try {
    // Βασική υλοποίηση που υποστηρίζει μόνο απλά SELECT, INSERT, UPDATE, DELETE
    const lowerText = text.toLowerCase().trim();
    
    if (lowerText.startsWith('select')) {
      // Προσομοίωση SELECT
      const table = extractTableFromQuery(text);
      if (!table) throw new Error('Αδυναμία εξαγωγής πίνακα από το ερώτημα');
      
      const response = await supabase.get(`/rest/v1/${table}`);
      return [response.data, []];
    } 
    else if (lowerText.startsWith('insert')) {
      // Προσομοίωση INSERT
      const table = extractTableFromQuery(text);
      if (!table) throw new Error('Αδυναμία εξαγωγής πίνακα από το ερώτημα');
      
      // Απλοποιημένη υλοποίηση - στην πραγματικότητα θα χρειαζόταν πιο σύνθετη λογική
      const response = await supabase.post(`/rest/v1/${table}`, params[0]);
      return [response.data, []];
    }
    
    throw new Error('Μη υποστηριζόμενο SQL ερώτημα για REST API');
  } catch (error) {
    console.error('Σφάλμα εκτέλεσης REST API ερωτήματος:', error);
    throw error;
  }
};

// Βοηθητική συνάρτηση για εξαγωγή ονόματος πίνακα από SQL ερώτημα
function extractTableFromQuery(query) {
  // Απλοποιημένη υλοποίηση - θα χρειαζόταν πιο σύνθετη λογική
  const fromMatch = query.match(/from\s+(\w+)/i);
  const intoMatch = query.match(/into\s+(\w+)/i);
  const updateMatch = query.match(/update\s+(\w+)/i);
  
  return (fromMatch && fromMatch[1]) || 
         (intoMatch && intoMatch[1]) || 
         (updateMatch && updateMatch[1]) || 
         null;
}

// Δοκιμή σύνδεσης
const testConnection = async () => {
  try {
    console.log(`Δοκιμή σύνδεσης REST API στο ${SUPABASE_URL}...`);
    
    // Προσπαθούμε να συνδεθούμε με το API της Supabase REST
    const response = await axios({
      method: 'get',
      url: `${SUPABASE_URL}/rest/v1/users?limit=1`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      timeout: 15000,
      // Απαραίτητο για IPv4 σε περιβάλλοντα που προτιμούν IPv6
      family: 4,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
    
    console.log('ΕΠΙΤΥΧΗΣ ΣΥΝΔΕΣΗ με το Supabase REST API!');
    console.log(`Κωδικός απάντησης: ${response.status}`);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`Πλήθος αποτελεσμάτων: ${response.data.length}`);
    }
    
    return true;
  } catch (error) {
    console.error('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ με το Supabase REST API:');
    
    // Λεπτομερής καταγραφή σφάλματος
    if (error.response) {
      // Λάβαμε απάντηση από τον server με κωδικό σφάλματος
      console.error(`Κωδικός απάντησης: ${error.response.status}`);
      console.error('Δεδομένα απάντησης:', error.response.data);
      console.error('Headers απάντησης:', error.response.headers);
    } else if (error.request) {
      // Έγινε αίτημα αλλά δεν λάβαμε απάντηση
      console.error('Δεν λάβαμε απάντηση από το server');
      console.error('Λεπτομέρειες αιτήματος:', 
        JSON.stringify(error.request).substring(0, 200));
    } else {
      // Κάτι άλλο προκάλεσε σφάλμα
      console.error('Μήνυμα σφάλματος:', error.message);
    }
    
    // Έλεγχος για σφάλματα DNS
    if (error.code === 'ENOTFOUND') {
      console.error(`Το hostname ${error.hostname || SUPABASE_URL} δεν βρέθηκε - πιθανό πρόβλημα DNS`);
      console.error('Δοκιμάστε να προσπελάσετε το URL μέσω προγράμματος περιήγησης για να επιβεβαιώσετε ότι λειτουργεί');
    }
    
    // Περιορισμένο stack trace για λιγότερα logs
    if (error.stack) {
      console.error('Στοίβα σφάλματος:', 
        error.stack.split('\n').slice(0, 3).join('\n'));
    }
    
    return false;
  }
};

// Εκτέλεση δοκιμαστικής σύνδεσης
console.log('Δοκιμάζουμε τη σύνδεση με το Supabase REST API...');
testConnection()
  .then(success => {
    if (success) {
      console.log('Η σύνδεση με το Supabase REST API είναι εφικτή!');
    } else {
      console.error('Η σύνδεση με το Supabase REST API απέτυχε!');
    }
  })
  .catch(err => {
    console.error('Εξαίρεση κατά τη δοκιμή σύνδεσης:', err.message);
  });

console.log('-------- ΤΕΛΟΣ ΔΙΑΓΝΩΣΤΙΚΩΝ SUPABASE-CLIENT --------');

module.exports = {
  query,
  testConnection,
  users,
  restaurants,
  reservations,
  // Προσομοίωση του pool interface
  pool: {
    query: async (text, params) => {
      const result = await query(text, params);
      return { rows: result[0] };
    }
  }
}; 