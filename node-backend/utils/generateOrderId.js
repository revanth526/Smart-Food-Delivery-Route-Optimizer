const Order = require('../models/Order');

/**
 * Generates a unique, sequential Order ID formatted as FD-YYYYMMDD-XXXX
 * @returns {Promise<string>} - Generated Order ID
 */
const generateOrderId = async () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  const datePrefix = `${yyyy}${mm}${dd}`;
  const searchPattern = `FD-${datePrefix}-`;

  // Count the number of existing orders matching today's prefix
  const todayCount = await Order.countDocuments({
    orderId: { $regex: `^${searchPattern}` }
  });

  const sequentialNumber = String(todayCount + 1).padStart(4, '0');
  return `${searchPattern}${sequentialNumber}`;
};

module.exports = generateOrderId;
