const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db_postgres');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const { errorHandler } = require('./middleware/errorHandler');

// Φόρτωση περιβαλλοντικών μεταβλητών
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Διαδρομές
app.get('/', (req, res) => {
  res.json({ message: 'Καλώς ήρθατε στο API του Restaurant Reservation App' });
});

// Έλεγχος σύνδεσης με τη βάση δεδομένων
app.get('/api/test-db', async (req, res) => {
  const isConnected = await testConnection();
  if (isConnected) {
    res.json({ message: 'Επιτυχής σύνδεση με τη βάση δεδομένων' });
  } else {
    res.status(500).json({ message: 'Αποτυχία σύνδεσης με τη βάση δεδομένων' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);

// Error handler
app.use(errorHandler);

// Εκκίνηση του server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ο διακομιστής τρέχει στη θύρα ${PORT}`);
}); 