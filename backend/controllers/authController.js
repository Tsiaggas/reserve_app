const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Δημιουργία JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// @desc    Εγγραφή χρήστη
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Έλεγχος αν υπάρχουν όλα τα πεδία
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Παρακαλώ συμπληρώστε όλα τα πεδία' });
    }

    // Έλεγχος αν υπάρχει ήδη χρήστης με αυτό το email
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Υπάρχει ήδη χρήστης με αυτό το email' });
    }

    // Κρυπτογράφηση του κωδικού
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Αποθήκευση του χρήστη στη βάση
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Δημιουργία token
    const token = generateToken(result.insertId);

    res.status(201).json({
      userId: result.insertId,
      name,
      email,
      token
    });
  } catch (error) {
    console.error('Σφάλμα κατά την εγγραφή:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

// @desc    Σύνδεση χρήστη
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt with:', email);

    // Έλεγχος αν υπάρχουν όλα τα πεδία
    if (!email || !password) {
      return res.status(400).json({ message: 'Παρακαλώ συμπληρώστε όλα τα πεδία' });
    }

    // Έλεγχος αν υπάρχει ο χρήστης
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    console.log('Users found:', users.length);
    if (users.length > 0) {
      console.log('User data found, verifying password');
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'Λάθος στοιχεία σύνδεσης' });
    }

    const user = users[0];

    // Έλεγχος του κωδικού
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Λάθος στοιχεία σύνδεσης' });
    }
    
    // Δημιουργία token
    const token = generateToken(user.user_id);

    res.status(200).json({
      userId: user.user_id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Σφάλμα κατά τη σύνδεση:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

module.exports = { register, login }; 