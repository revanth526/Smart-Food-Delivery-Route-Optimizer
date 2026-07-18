const express = require('express');
const router = express.Router();
const {
  submitPayment,
  moderatePayment,
  getPaymentByOrderId
} = require('../controllers/paymentController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Customer submits payment details
router.post('/submit', authMiddleware, submitPayment);

// Admin / Customer checks payment status of an order
router.get('/order/:orderId', authMiddleware, getPaymentByOrderId);

// Admin moderates (approves/rejects) a payment
router.patch('/moderate/:orderId', adminMiddleware, moderatePayment);

module.exports = router;
