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
    if (!connectionString) return null;
    
    // Εξαγωγή host από το connection string
    const hostMatch = connectionString.match(/@([^:]+):/);
    if (!hostMatch || !hostMatch[1]) return null;
    
    const host = hostMatch[1];
    // Το project ID είναι το πρώτο τμήμα του host
    const projectId = host.split('.')[0];
    
    return {
      host,
      projectId,
      // Συνθέτουμε το Supabase URL
      url: `https://${projectId}.supabase.co`,
      // Χρειάζεται να ορίσετε αυτό το κλειδί στο .env.supabase
      key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbXljaG1lemV4bGZzcGtsYWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NDAyNDksImV4cCI6MjAzNDAxNjI0OX0._ULj1NOAkCh5BcCUfyjvqf9lh-qUAfYx7y7IbGKPMsM'
    };
  } catch (error) {
    console.error('Σφάλμα εξαγωγής πληροφοριών Supabase:', error);
    return null;
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
  timeout: 10000
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
    // Απλό ερώτημα health check
    const response = await supabase.get('rest/v1/');
    console.log('ΕΠΙΤΥΧΗΣ ΣΥΝΔΕΣΗ με το Supabase REST API!');
    return true;
  } catch (error) {
    console.error('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ με το Supabase REST API:', error);
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