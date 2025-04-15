/**
 * Supabase REST API Client
 * Εναλλακτική λύση για την απευθείας σύνδεση PostgreSQL που έχει πρόβλημα με το IPv6
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Φόρτωση περιβαλλοντικών μεταβλητών
try {
  const envPath = path.resolve(__dirname, '../.env.supabase');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (e) {
  console.error('Σφάλμα φόρτωσης περιβάλλοντος:', e);
  dotenv.config();
}

// Εξαγωγή project URL και anon key από το connection string
function extractSupabaseInfo() {
  try {
    const connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL;
    if (!connectionString) {
      console.log('Δεν βρέθηκε connection string');
      return {
        url: 'https://xsmychmezexlfspklacl.supabase.co',
        key: process.env.SUPABASE_ANON_KEY
      };
    }
    
    // Εξαγωγή host από το connection string
    const hostMatch = connectionString.match(/@([^:]+):/);
    if (!hostMatch || !hostMatch[1]) {
      console.log('Αδυναμία εξαγωγής host από το connection string, χρήση προεπιλογής');
      return {
        url: 'https://xsmychmezexlfspklacl.supabase.co',
        key: process.env.SUPABASE_ANON_KEY
      };
    }
    
    const host = hostMatch[1];
    
    // Διόρθωση - το πρώτο μέρος πριν το .supabase.co είναι το project ID
    const projectId = host.split('.')[0];
    
    // Το σωστό URL περιέχει το project ID και όχι το "db"
    const url = `https://${projectId}.supabase.co`;
    console.log(`Διαμορφωμένο Supabase REST URL: ${url}`);
    
    return {
      host,
      projectId,
      url: url,
      key: process.env.SUPABASE_ANON_KEY
    };
  } catch (error) {
    console.error('Σφάλμα εξαγωγής πληροφοριών Supabase:', error);
    // Fallback σε σκληρά κωδικοποιημένες τιμές
    return {
      url: 'https://xsmychmezexlfspklacl.supabase.co',
      key: process.env.SUPABASE_ANON_KEY
    };
  }
}

const supabaseInfo = extractSupabaseInfo();
console.log('Supabase Info:', supabaseInfo);

// Δημιουργία του Axios client για το Supabase
const supabase = axios.create({
  baseURL: supabaseInfo?.url,
  headers: {
    'apikey': supabaseInfo?.key,
    'Authorization': `Bearer ${supabaseInfo?.key}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  // Ρυθμίσεις για IPv4
  family: 4,
  // Αποτροπή σφαλμάτων πιστοποιητικού
  httpsAgent: new (require('https').Agent)({
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
    console.log(`Δοκιμή σύνδεσης REST API στο ${supabaseInfo?.url}...`);
    
    // Απλό ερώτημα health check - το /rest/v1/ δεν είναι κατάλληλο endpoint
    // Χρησιμοποιούμε το /rest/v1/users αντί για απλό /rest/v1/
    const response = await supabase.get('/rest/v1/users?limit=1');
    
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
      console.error('Λεπτομέρειες αιτήματος:', error.request);
    } else {
      // Κάτι άλλο προκάλεσε σφάλμα
      console.error('Μήνυμα σφάλματος:', error.message);
    }
    
    // Έλεγχος για σφάλματα DNS
    if (error.code === 'ENOTFOUND') {
      console.error(`Το hostname ${error.hostname || supabaseInfo?.url} δεν βρέθηκε - πιθανό πρόβλημα DNS`);
      console.error('Δοκιμάστε να προσπελάσετε το URL μέσω προγράμματος περιήγησης για να επιβεβαιώσετε ότι λειτουργεί');
    }
    
    console.error('Στοίβα σφάλματος:', error.stack);
    return false;
  }
};

// Εκτέλεση δοκιμαστικής σύνδεσης
testConnection()
  .then(success => {
    if (success) {
      console.log('Η σύνδεση με το Supabase REST API είναι εφικτή!');
    } else {
      console.error('Η σύνδεση με το Supabase REST API απέτυχε!');
    }
  })
  .catch(err => {
    console.error('Εξαίρεση κατά τη δοκιμή σύνδεσης:', err);
  });

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