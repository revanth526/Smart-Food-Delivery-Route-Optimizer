const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
});

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  orderedItems: {
    type: [OrderItemSchema],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Pending Verification', 'Paid', 'Rejected'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Pending Verification', 'Order Confirmed', 'Preparing Food', 'Delivery Partner Picked', 'On the Way', 'Delivered', 'Rejected'],
    default: 'Order Confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
