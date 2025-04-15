const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurantById } = require('../controllers/restaurantController');
const { protect } = require('../middleware/auth');

// Δημόσιες διαδρομές - προσβάσιμες χωρίς αυθεντικοποίηση
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

// Προστατευμένες διαδρομές - απαιτούν αυθεντικοποίηση
// Αν θέλετε να προσθέσετε διαχειριστικές λειτουργίες όπως
// δημιουργία/επεξεργασία/διαγραφή εστιατορίων, μπορείτε να τις
// προσθέσετε εδώ με το middleware προστασίας
// router.use(protect);
// router.post('/', createRestaurant);
// router.put('/:id', updateRestaurant);
// router.delete('/:id', deleteRestaurant);

module.exports = router; 