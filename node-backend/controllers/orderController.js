const Order = require('../models/Order');
const generateOrderId = require('../utils/generateOrderId');

/**
 * Creates a new order for a customer
 */
const createOrder = async (req, res) => {
  try {
    const { customerName, phoneNumber, deliveryAddress, orderedItems, paymentMethod } = req.body;
    
    // Validations
    if (!customerName || !phoneNumber || !deliveryAddress || !orderedItems || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'All order checkout fields are required.' });
    }

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart orderedItems list must contain at least 1 dish.' });
    }

    // Calculate total prices and items quantities
    let totalQty = 0;
    let totalPrice = 0;
    
    const formattedItems = orderedItems.map(item => {
      const price = parseFloat(item.price);
      const qty = parseInt(item.quantity);
      if (isNaN(price) || isNaN(qty) || qty <= 0) {
        throw new Error('Invalid item price or quantity.');
      }
      totalQty += qty;
      totalPrice += price * qty;

      return {
        itemName: item.itemName,
        price,
        quantity: qty
      };
    });

    // Auto-generate the unique Order ID (FD-YYYYMMDD-XXXX)
    const customOrderId = await generateOrderId();

    // Persist order details to MongoDB
    const newOrder = await Order.create({
      orderId: customOrderId,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      orderedItems: formattedItems,
      quantity: totalQty,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'Online' ? 'Paid' : 'Pending',
      orderStatus: 'Order Confirmed'
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: newOrder
    });

  } catch (err) {
    console.error('Create Order Error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Error placing order.' });
  }
};

/**
 * Retrieves all orders, supporting optional search filters
 */
const getAllOrders = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter = {
        $or: [
          { orderId: searchRegex },
          { phoneNumber: searchRegex },
          { customerName: searchRegex }
        ]
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Get Orders Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error loading orders.' });
  }
};

/**
 * Retrieves a single order matching the custom Order ID
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: `Order with ID ${orderId} not found.` });
    }
    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Get Order By ID Error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving order.' });
  }
};

/**
 * Updates an order status or payment status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: `Order with ID ${orderId} not found.` });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    
    // Broadcast realtime update to listening clients
    try {
      const { broadcastOrderUpdate } = require('../services/supabaseService');
      broadcastOrderUpdate(orderId, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
      });
    } catch (broadcastErr) {
      console.warn('Realtime Supabase broadcast failed:', broadcastErr.message);
    }

    return res.status(200).json({ success: true, message: 'Order status updated successfully.', order });
  } catch (err) {
    console.error('Update Order Status Error:', err);
    return res.status(500).json({ success: false, message: 'Error updating order status.' });
  }
};

/**
 * Deletes an order from the system
 */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await Order.deleteOne({ orderId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: `Order with ID ${orderId} not found.` });
    }
    return res.status(200).json({ success: true, message: `Order ${orderId} deleted successfully.` });
  } catch (err) {
    console.error('Delete Order Error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting order.' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};
