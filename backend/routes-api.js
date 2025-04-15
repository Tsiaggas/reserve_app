/**
 * Απλοποιημένο API router που χρησιμοποιεί απευθείας το Supabase REST API
 * αντί για SQL queries που έχουν πρόβλημα με το IPv6
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./config/supabase-client');

// Διαγνωστική διαδρομή
router.get('/diagnostics', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '8080'
    },
    supabase: {
      url: 'https://xsmychmezexlfspklacl.supabase.co',
      keyDefined: !!process.env.SUPABASE_ANON_KEY,
      version: 'direct-rest-api'
    },
    message: 'Το simple-api λειτουργεί κανονικά'
  });
});

// Διαδρομή για test
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Το API λειτουργεί (simple-api)',
    timestamp: new Date().toISOString()
  });
});

// Διαδρομή για έλεγχο συνδεσιμότητας REST API
router.get('/connection-test', async (req, res) => {
  try {
    // Εκτέλεση δοκιμαστικής σύνδεσης
    const result = await supabase.testConnection();
    
    res.json({
      success: result,
      message: result ? 'Επιτυχής σύνδεση με REST API' : 'Αποτυχία σύνδεσης με REST API',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Σφάλμα κατά τον έλεγχο σύνδεσης',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Διαδρομές για χρήστες
router.post('/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Έλεγχος αν ο χρήστης υπάρχει ήδη
    const existingUser = await supabase.users.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Ο χρήστης υπάρχει ήδη' });
    }
    
    // Κρυπτογράφηση κωδικού
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Δημιουργία χρήστη
    const newUser = await supabase.users.create({
      name,
      email,
      password: hashedPassword
    });
    
    // Δημιουργία token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'Επιτυχής εγγραφή',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Σφάλμα κατά την εγγραφή χρήστη:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την εγγραφή', error: error.message });
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Αναζήτηση χρήστη
    const user = await supabase.users.getByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Ο χρήστης δεν βρέθηκε' });
    }
    
    // Έλεγχος κωδικού
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Λανθασμένος κωδικός' });
    }
    
    // Δημιουργία token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Επιτυχής σύνδεση',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Σφάλμα κατά τη σύνδεση χρήστη:', error);
    res.status(500).json({ message: 'Σφάλμα κατά τη σύνδεση', error: error.message });
  }
});

// Διαδρομές για εστιατόρια
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await supabase.restaurants.getAll();
    res.json(restaurants);
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση εστιατορίων:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση εστιατορίων', error: error.message });
  }
});

router.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await supabase.restaurants.getById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Το εστιατόριο δεν βρέθηκε' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση εστιατορίου:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση εστιατορίου', error: error.message });
  }
});

// Διαδρομές για κρατήσεις
router.get('/reservations', async (req, res) => {
  try {
    const reservations = await supabase.reservations.getAll();
    res.json(reservations);
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση κρατήσεων:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση κρατήσεων', error: error.message });
  }
});

router.get('/reservations/user/:userId', async (req, res) => {
  try {
    const reservations = await supabase.reservations.getByUserId(req.params.userId);
    res.json(reservations);
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση κρατήσεων χρήστη:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση κρατήσεων χρήστη', error: error.message });
  }
});

router.post('/reservations', async (req, res) => {
  try {
    const newReservation = await supabase.reservations.create(req.body);
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Σφάλμα κατά τη δημιουργία κράτησης:', error);
    res.status(500).json({ message: 'Σφάλμα κατά τη δημιουργία κράτησης', error: error.message });
  }
});

module.exports = router; 