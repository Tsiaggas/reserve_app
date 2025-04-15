const { pool } = require('../config/db');

// @desc    Λήψη όλων των εστιατορίων
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res) => {
  try {
    const { name, location } = req.query;
    let query = 'SELECT * FROM restaurants';
    let queryParams = [];

    // Προσθήκη παραμέτρων αναζήτησης αν υπάρχουν
    if (name || location) {
      const conditions = [];
      
      if (name) {
        conditions.push('name LIKE ?');
        queryParams.push(`%${name}%`);
      }
      
      if (location) {
        conditions.push('location LIKE ?');
        queryParams.push(`%${location}%`);
      }

      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [restaurants] = await pool.query(query, queryParams);

    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Σφάλμα κατά τη λήψη εστιατορίων:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

// @desc    Λήψη ενός εστιατορίου με id
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
  try {
    const [restaurants] = await pool.query(
      'SELECT * FROM restaurants WHERE restaurant_id = ?',
      [req.params.id]
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ message: 'Το εστιατόριο δε βρέθηκε' });
    }

    res.status(200).json(restaurants[0]);
  } catch (error) {
    console.error('Σφάλμα κατά τη λήψη εστιατορίου:', error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή' });
  }
};

module.exports = { getRestaurants, getRestaurantById }; 