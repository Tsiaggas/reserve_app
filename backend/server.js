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
let db, authRoutes, restaurantRoutes, reservationRoutes, errorHandler;

try {
  db = require('./config/db_postgres');
  console.log('Module db_postgres φορτώθηκε');
} catch (e) {
  console.error('Σφάλμα φόρτωσης db_postgres:', e);
  process.exit(1);
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