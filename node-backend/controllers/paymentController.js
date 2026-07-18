const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { broadcastOrderUpdate } = require('../services/supabaseService');

/**
 * Creates/submits a payment record for verification
 */
const submitPayment = async (req, res) => {
  try {
    const { orderId, transactionId, paymentScreenshotUrl } = req.body;
    const customerId = req.user?.id || 'simulated-customer';

    if (!orderId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Order ID and Transaction ID (UTR) are required.' });
    }

    // Find the corresponding order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check if a payment for this order already exists
    let payment = await Payment.findOne({ orderId });
    if (payment) {
      // Overwrite/update if rejected (for resubmission)
      payment.transactionId = transactionId;
      payment.paymentScreenshotUrl = paymentScreenshotUrl || '';
      payment.paymentStatus = 'Pending Verification';
      payment.adminRemark = '';
      payment.verifiedAt = null;
      payment.verifiedBy = '';
      await payment.save();
    } else {
      // Create new payment record
      payment = await Payment.create({
        orderId,
        customerId,
        transactionId,
        paymentScreenshotUrl: paymentScreenshotUrl || '',
        paymentStatus: 'Pending Verification'
      });
    }

    // Update order status to Pending Verification
    order.orderStatus = 'Pending Verification';
    order.paymentStatus = 'Pending Verification';
    await order.save();

    // Broadcast live update
    broadcastOrderUpdate(orderId, {
      orderStatus: 'Pending Verification',
      paymentStatus: 'Pending Verification'
    });

    return res.status(201).json({
      success: true,
      message: 'Payment verification details submitted successfully.',
      payment,
      order
    });
  } catch (err) {
    console.error('Submit Payment Error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Error submitting payment details.' });
  }
};

/**
 * Allows an admin to approve or reject a payment
 */
const moderatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, remark } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user?.id || 'simulated-admin';

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid action (approve/reject) is required.' });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order.' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found.' });
    }

    if (action === 'approve') {
      payment.paymentStatus = 'Paid';
      payment.adminRemark = remark || 'Payment verified. Approved.';
      payment.verifiedBy = adminId;
      payment.verifiedAt = new Date();

      order.paymentStatus = 'Paid';
      order.orderStatus = 'Order Confirmed'; // Push order into preparation queue
    } else {
      payment.paymentStatus = 'Rejected';
      payment.adminRemark = remark || 'Payment details verification failed.';
      payment.verifiedBy = adminId;
      payment.verifiedAt = new Date();

      order.paymentStatus = 'Rejected';
      order.orderStatus = 'Rejected';
    }

    await payment.save();
    await order.save();

    // Broadcast changes
    broadcastOrderUpdate(orderId, {
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    return res.status(200).json({
      success: true,
      message: `Payment successfully ${action}d.`,
      payment,
      order
    });
  } catch (err) {
    console.error('Moderate Payment Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error moderating payment.' });
  }
};

/**
 * Gets payment details for a specific order
 */
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(200).json({ success: true, payment: null });
    }
    return res.status(200).json({ success: true, payment });
  } catch (err) {
    console.error('Get Payment Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error retrieving payment details.' });
  }
};

module.exports = {
  submitPayment,
  moderatePayment,
  getPaymentByOrderId
};
