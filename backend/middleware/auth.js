const jwt = require('jsonwebtoken');

// Middleware για την επαλήθευση του JWT token
const protect = (req, res, next) => {
  let token;

  // Έλεγχος ύπαρξης token στο header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Λήψη token από το header
    token = req.headers.authorization.split(' ')[1];
  }

  // Έλεγχος αν το token υπάρχει
  if (!token) {
    return res.status(401).json({ message: 'Δεν έχετε δικαίωμα πρόσβασης, λείπει το token' });
  }

  try {
    // Επαλήθευση token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Προσθήκη των στοιχείων του χρήστη στο request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Δεν έχετε δικαίωμα πρόσβασης, άκυρο token' });
  }
};

module.exports = { protect }; 