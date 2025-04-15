const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, pool } = require('./config/db_postgres');
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const reservationRoutes = require('./routes/reservations');
const errorHandler = require('./middleware/error');

// Φόρτωση των μεταβλητών περιβάλλοντος από το .env.supabase
dotenv.config({ path: '.env.supabase' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Αρχική διαδρομή
app.get('/', (req, res) => {
  res.json({ 
    message: 'Καλωσήρθατε στο API του Restaurant Reservation App',
    databaseUrl: process.env.DATABASE_URL ? 'Ορίστηκε' : 'Δεν έχει οριστεί'
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
      port: process.env.PORT || 5000,
      databaseUrl: process.env.DATABASE_URL ? 'Ορίστηκε' : 'Δεν έχει οριστεί',
    },
    database: {
      status: 'Έλεγχος...',
      message: '',
      time: null
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

// Χειρισμός σφαλμάτων
app.use(errorHandler);

// Εκκίνηση του server
const PORT = process.env.PORT || 5000;

// Έλεγχος για το DATABASE_URL
console.log(`DATABASE_URL ${process.env.DATABASE_URL ? 'έχει οριστεί' : 'ΔΕΝ έχει οριστεί'}`);

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