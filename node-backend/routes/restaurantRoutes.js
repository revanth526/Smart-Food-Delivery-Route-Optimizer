const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving restaurants.' });
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving restaurant details.' });
  }
});

// Get menu items by restaurant ID
router.get('/menu/:restaurantId', async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.restaurantId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving menu items.' });
  }
});

// Create new restaurant (Admin operation)
router.post('/restaurants', adminMiddleware, async (req, res) => {
  try {
    const { name, address, rating, latitude, longitude } = req.body;
    const newRest = await Restaurant.create({
      name,
      address,
      rating: parseFloat(rating),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });
    res.status(201).json(newRest);
  } catch (err) {
    res.status(400).json({ message: 'Error creating restaurant.' });
  }
});

// Delete restaurant (Admin operation)
router.delete('/restaurants/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Remove associated menu items first
    await MenuItem.deleteMany({ restaurant: id });
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting restaurant.' });
  }
});

// Create menu item (Admin operation)
router.post('/menu', adminMiddleware, async (req, res) => {
  try {
    const { restaurantId, itemName, price } = req.body;
    const newItem = await MenuItem.create({
      restaurant: restaurantId,
      itemName,
      price: parseFloat(price)
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: 'Error adding menu item.' });
  }
});

// Delete menu item (Admin operation)
router.delete('/menu/:id', adminMiddleware, async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Menu item not found.' });
    res.json({ message: 'Menu item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting menu item.' });
  }
});

module.exports = router;
