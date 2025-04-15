const { pool } = require('../config/db');

// @desc    Δημιουργία κράτησης
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  try {
    const { restaurant_id, date, time, people_count } = req.body;
    const user_id = req.user.userId;

    // Έλεγχος αν υπάρχουν όλα τα πεδία
    if (!restaurant_id || !date || !time || !people_count) {
      return res.status(400).json({ message: 'Παρακαλώ συμπληρώστε όλα τα πεδία' });
    }

    // Έλεγχος αν υπάρχει το εστιατόριο
    const [restaurants] = await pool.query(
      'SELECT * FROM restaurants WHERE restaurant_id = ?',
      [restaurant_id]
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ message: 'Το εστιατόριο δε βρέθηκε' });
    }

    // Δημιουργία της κράτησης
    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, restaurant_id, date, time, people_count) VALUES (?, ?, ?, ?, ?)',
      [user_id, restaurant_id, date, time, people_count]
    );

    res.status(201).json({
      reservation_id: result.insertId,
      user_id,
      restaurant_id,
      date,
      time,
      people_count,
      status: 'active'
    });
  } catch (error) {
    console.error('Σφάλμα κατά τη δημιουργία κράτησης:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

// @desc    Λήψη κρατήσεων χρήστη
// @route   GET /api/user/reservations
// @access  Private
const getUserReservations = async (req, res) => {
  try {
    const user_id = req.user.userId;

    // Λήψη κρατήσεων με πληροφορίες εστιατορίου
    const [reservations] = await pool.query(
      `SELECT r.*, rest.name as restaurant_name, rest.location as restaurant_location
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.restaurant_id
       WHERE r.user_id = ?
       ORDER BY r.date DESC, r.time DESC`,
      [user_id]
    );

    res.status(200).json(reservations);
  } catch (error) {
    console.error('Σφάλμα κατά τη λήψη κρατήσεων χρήστη:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

// @desc    Ενημέρωση κράτησης
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = async (req, res) => {
  try {
    const { date, time, people_count, status } = req.body;
    const reservation_id = req.params.id;
    const user_id = req.user.userId;

    // Έλεγχος αν η κράτηση υπάρχει και ανήκει στον συγκεκριμένο χρήστη
    const [reservations] = await pool.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ?',
      [reservation_id, user_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'Η κράτηση δε βρέθηκε ή δεν έχετε δικαίωμα πρόσβασης' });
    }

    const reservation = reservations[0];

    // Έλεγχος αν η κράτηση είναι για μελλοντική ημερομηνία
    const reservationDate = new Date(`${reservation.date} ${reservation.time}`);
    const now = new Date();

    if (reservationDate < now && status !== 'cancelled') {
      return res.status(400).json({ message: 'Δεν μπορείτε να τροποποιήσετε παρελθούσες κρατήσεις' });
    }

    // Ενημέρωση της κράτησης
    const updateFields = [];
    const updateValues = [];

    if (date) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }

    if (time) {
      updateFields.push('time = ?');
      updateValues.push(time);
    }

    if (people_count) {
      updateFields.push('people_count = ?');
      updateValues.push(people_count);
    }

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Δεν παρέχονται πεδία για ενημέρωση' });
    }

    // Προσθήκη του reservation_id στο τέλος του πίνακα παραμέτρων
    updateValues.push(reservation_id);

    await pool.query(
      `UPDATE reservations SET ${updateFields.join(', ')} WHERE reservation_id = ?`,
      updateValues
    );

    res.status(200).json({ message: 'Η κράτηση ενημερώθηκε επιτυχώς' });
  } catch (error) {
    console.error('Σφάλμα κατά την ενημέρωση κράτησης:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

// @desc    Διαγραφή κράτησης
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = async (req, res) => {
  try {
    const reservation_id = req.params.id;
    const user_id = req.user.userId;

    // Έλεγχος αν η κράτηση υπάρχει και ανήκει στον συγκεκριμένο χρήστη
    const [reservations] = await pool.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ?',
      [reservation_id, user_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'Η κράτηση δε βρέθηκε ή δεν έχετε δικαίωμα πρόσβασης' });
    }

    const reservation = reservations[0];

    // Έλεγχος αν η κράτηση είναι για μελλοντική ημερομηνία
    const reservationDate = new Date(`${reservation.date} ${reservation.time}`);
    const now = new Date();

    if (reservationDate < now) {
      return res.status(400).json({ message: 'Δεν μπορείτε να διαγράψετε παρελθούσες κρατήσεις' });
    }

    // Διαγραφή της κράτησης
    await pool.query('DELETE FROM reservations WHERE reservation_id = ?', [reservation_id]);

    res.status(200).json({ message: 'Η κράτηση διαγράφηκε επιτυχώς' });
  } catch (error) {
    console.error('Σφάλμα κατά τη διαγραφή κράτησης:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  updateReservation,
  deleteReservation
}; 