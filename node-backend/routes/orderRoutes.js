const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// Middlewares
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Local flexible authenticator to allow both customers and admins to fetch an order by ID
const flexibleAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token required.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    let account = await User.findById(decoded.id);
    if (!account) {
      account = await Admin.findById(decoded.id);
    }

    if (!account) {
      return res.status(403).json({ success: false, message: 'Invalid session.' });
    }

    req.user = account;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

// Endpoints
router.post('/', authMiddleware, createOrder);              // Customer checkout
router.get('/', adminMiddleware, getAllOrders);             // Admin order view / search
router.get('/:orderId', flexibleAuth, getOrderById);        // Track specific order
router.patch('/:orderId', adminMiddleware, updateOrderStatus); // Admin update status
router.delete('/:orderId', adminMiddleware, deleteOrder);   // Admin delete order

module.exports = router;
