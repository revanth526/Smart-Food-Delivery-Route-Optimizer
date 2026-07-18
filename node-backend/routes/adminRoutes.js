const express = require('express');
const router = express.Router();
const { login, profile, getDashboardStats } = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin Endpoints
router.post('/login', login);
router.get('/profile', adminMiddleware, profile);
router.get('/dashboard', adminMiddleware, getDashboardStats);

module.exports = router;
