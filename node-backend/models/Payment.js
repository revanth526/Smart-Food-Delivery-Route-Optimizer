const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: String, // Matches custom orderId
    required: true,
    ref: 'Order'
  },
  customerId: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  qrImageUrl: {
    type: String,
    default: '/upi_qr.png'
  },
  paymentScreenshotUrl: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['Pending Verification', 'Paid', 'Rejected'],
    default: 'Pending Verification'
  },
  adminRemark: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PaymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
