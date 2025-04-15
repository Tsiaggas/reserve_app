const express = require('express');
const router = express.Router();
const {
  createReservation,
  getUserReservations,
  updateReservation,
  deleteReservation
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

// Προστασία όλων των διαδρομών με middleware αυθεντικοποίησης
router.use(protect);

// Routes
router.post('/', createReservation);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);
router.get('/user', getUserReservations);

module.exports = router; 