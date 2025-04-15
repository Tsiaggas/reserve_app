// Φόρτωση του network-workaround πριν από οτιδήποτε άλλο
try {
  require('./network-workaround');
  console.log('Network workaround φορτώθηκε επιτυχώς');
} catch (e) {
  console.error('Αποτυχία φόρτωσης του network-workaround:', e);
}

// Δοκιμή της HTTP σύνδεσης με το Supabase
try {
  require('./supabase-connect');
  console.log('Supabase HTTP connectivity test φορτώθηκε');
} catch (e) {
  console.error('Αποτυχία φόρτωσης του supabase-connect:', e);
}

// Ρύθμιση περιβάλλοντος IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// Αναγκαστική χρήση IPv4 για όλες τις συνδέσεις HTTP
require('https').globalAgent.options.family = 4;
require('http').globalAgent.options.family = 4;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Φόρτωση των περιβαλλοντικών μεταβλητών πριν οτιδήποτε άλλο
try {
  const envPath = path.resolve(__dirname, '.env.supabase');
  console.log('Έλεγχος για αρχείο:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('Φόρτωση μεταβλητών από:', envPath);
    dotenv.config({ path: envPath });
    // Απευθείας φόρτωση του URL βάσης δεδομένων
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=([^\n]+)/);
      if (dbUrlMatch && dbUrlMatch[1]) {
        let dbUrl = dbUrlMatch[1];
        // Προσθήκη sslmode και ipversion αν δεν υπάρχουν
        if (!dbUrl.includes('?')) {
          dbUrl += '?sslmode=require&ipversion=4';
        } else if (!dbUrl.includes('ipversion=4')) {
          dbUrl += '&ipversion=4';
        }
        process.env.DATABASE_URL = dbUrl;
        console.log('DATABASE_URL φορτώθηκε επιτυχώς (μήκος:', dbUrl.length, ')');
      }
    }
  } else {
    console.log('Το αρχείο .env.supabase δεν βρέθηκε, χρήση .env');
    dotenv.config();
  }
} catch (e) {
  console.error('Σφάλμα κατά τη φόρτωση περιβάλλοντος:', e);
  dotenv.config();
}

// Εμφάνιση διαδρομών για διαγνωστικά
console.log('Τρέχων φάκελος:', __dirname);
console.log('Λίστα αρχείων:');
try {
  const files = fs.readdirSync(__dirname);
  files.forEach(file => console.log(' - ' + file));
  
  const routesPath = path.join(__dirname, 'routes');
  if (fs.existsSync(routesPath)) {
    console.log('Αρχεία στο /routes:');
    fs.readdirSync(routesPath).forEach(file => console.log(' - ' + file));
  } else {
    console.log('Ο φάκελος routes δεν βρέθηκε');
  }
} catch (e) {
  console.error('Σφάλμα κατά την ανάγνωση φακέλων:', e);
}

// Φόρτωση των modules με χειρισμό σφαλμάτων
let db, authRoutes, restaurantRoutes, reservationRoutes, errorHandler, simpleApiRoutes;

// Νέο API με REST
try {
  simpleApiRoutes = require('./routes-api');
  console.log('Module routes-api φορτώθηκε επιτυχώς');
} catch (e) {
  console.error('Σφάλμα φόρτωσης routes-api:', e);
}

// Πρώτα δοκιμάζουμε το REST API client
try {
  db = require('./config/supabase-client');
  console.log('Module supabase-client φορτώθηκε επιτυχώς');
} catch (e) {
  console.error('Σφάλμα φόρτωσης supabase-client:', e);
  
  // Εναλλακτικά δοκιμάζουμε το κανονικό db.js
  try {
    db = require('./config/db');
    console.log('Module db φορτώθηκε');
  } catch (dbError) {
    console.error('Σφάλμα φόρτωσης db:', dbError);
    
    // Τέλος δοκιμάζουμε το db_postgres
    try {
      db = require('./config/db_postgres');
      console.log('Module db_postgres φορτώθηκε ως fallback');
    } catch (pgError) {
      console.error('Σφάλμα φόρτωσης db_postgres:', pgError);
      process.exit(1);
    }
  }
}

try {
  authRoutes = require('./routes/authRoutes');
  console.log('Module authRoutes φορτώθηκε');
} catch (e) {
  console.error('Σφάλμα φόρτωσης authRoutes:', e);
  process.exit(1);
}

try {
  restaurantRoutes = require('./routes/restaurantRoutes');
  console.log('Module restaurantRoutes φορτώθηκε');
} catch (e) {
  console.error('Σφάλμα φόρτωσης restaurantRoutes:', e);
  process.exit(1);
}

try {
  reservationRoutes = require('./routes/reservationRoutes');
  console.log('Module reservationRoutes φορτώθηκε');
} catch (e) {
  console.error('Σφάλμα φόρτωσης reservationRoutes:', e);
  process.exit(1);
}

try {
  errorHandler = require('./middleware/errorHandler');
  console.log('Module errorHandler φορτώθηκε');
} catch (e) {
  console.error('Σφάλμα φόρτωσης errorHandler:', e);
  process.exit(1);
}

const app = express();
const { testConnection, pool } = db;

// Middleware
app.use(cors());
app.use(express.json());

// Αρχική διαδρομή
app.get('/', (req, res) => {
  res.json({ 
    message: 'Καλωσήρθατε στο API του Restaurant Reservation App',
    databaseUrl: process.env.DATABASE_URL ? 'Ορίστηκε' : 'Δεν έχει οριστεί',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '8080'
  });
});

// Διαδρομές
if (simpleApiRoutes) {
  app.use('/api/v2', simpleApiRoutes);
  console.log('Χρησιμοποιείται το νέο REST API στο /api/v2');
  console.log('Διαθέσιμα νέα endpoints:');
  console.log('- GET /api/v2/test - Απλός έλεγχος λειτουργίας');
  console.log('- GET /api/v2/diagnostics - Αναλυτικά διαγνωστικά');
  console.log('- GET /api/v2/connection-test - Έλεγχος σύνδεσης με Supabase REST API');
  console.log('- GET /api/v2/restaurants - Λίστα εστιατορίων');
  console.log('- POST /api/v2/users/register - Εγγραφή χρήστη');
  console.log('- POST /api/v2/users/login - Σύνδεση χρήστη');
}

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);

// Διαδρομή διαγνωστικών για τον έλεγχο της βάσης δεδομένων
app.get('/api/diagnostics', async (req, res) => {
  console.log('Εκτέλεση διαγνωστικών...');
  
  const diagnostics = {
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '8080',
      databaseUrl: process.env.DATABASE_URL ? 'Ορίστηκε' : 'Δεν έχει οριστεί',
    },
    database: {
      status: 'Έλεγχος...',
      message: '',
      time: null
    },
    files: {
      currentDir: __dirname,
      routes: fs.existsSync(path.join(__dirname, 'routes')) 
        ? fs.readdirSync(path.join(__dirname, 'routes'))
        : 'Δεν βρέθηκε ο φάκελος routes'
    }
  };

  try {
    console.log('Έλεγχος σύνδεσης βάσης δεδομένων...');
    const client = await pool.connect();
    
    // Ερώτημα για την τρέχουσα ώρα
    const timeResult = await client.query('SELECT NOW() as current_time');
    client.release();
    
    diagnostics.database = {
      status: 'Συνδεδεμένο',
      message: 'Επιτυχής σύνδεση με τη βάση δεδομένων',
      time: timeResult.rows[0].current_time
    };
    
    console.log('Διαγνωστικά ολοκληρώθηκαν με επιτυχία');
    res.json(diagnostics);
  } catch (error) {
    console.error('Σφάλμα στη διαγνωστική σύνδεση:', error);
    
    diagnostics.database = {
      status: 'Σφάλμα',
      message: `Αδυναμία σύνδεσης με τη βάση δεδομένων: ${error.message}`,
      error: error.stack
    };
    
    res.status(500).json(diagnostics);
  }
});

// Δοκιμαστική διαδρομή
app.get('/api/test', (req, res) => {
  res.json({ message: 'Δοκιμαστική διαδρομή λειτουργεί κανονικά!' });
});

// Διαδρομή που εμφανίζει τις μεταβλητές περιβάλλοντος
app.get('/api/env', (req, res) => {
  res.json({ 
    DATABASE_URL: process.env.DATABASE_URL ? 'Ορίστηκε (μήκος: ' + process.env.DATABASE_URL.length + ')' : 'Μη ορισμένο',
    PORT: process.env.PORT || '8080',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_REQUIRES_SSL: process.env.DATABASE_REQUIRES_SSL || 'false'
  });
});

// Χειρισμός σφαλμάτων
app.use(errorHandler.errorHandler);

// Εκκίνηση του server
const PORT = process.env.PORT || 8080;

// Έλεγχος για το DATABASE_URL
console.log(`DATABASE_URL ${process.env.DATABASE_URL ? 'έχει οριστεί' : 'ΔΕΝ έχει οριστεί'}`);
if (process.env.DATABASE_URL) {
  console.log('Μήκος DATABASE_URL:', process.env.DATABASE_URL.length);
  console.log('Αρχή DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

app.listen(PORT, () => {
  console.log(`Ο server είναι σε λειτουργία στη θύρα ${PORT}`);
  testConnection()
    .then(success => {
      if (success) {
        console.log('Η σύνδεση με τη βάση δεδομένων είναι επιτυχής');
      } else {
        console.error('Η σύνδεση με τη βάση δεδομένων απέτυχε');
      }
    })
    .catch(err => {
      console.error('Εξαίρεση κατά τον έλεγχο σύνδεσης:', err);
    });
}); 