const Admin = require('../models/Admin');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const supabase = require('../supabase');

/**
 * Handle Admin Authentication
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Lookup administrator in Supabase
    let admin = null;
    try {
      const { data: existingAdmin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (adminError) {
        console.warn('Supabase admins query error, checking local db fallback:', adminError.message);
      } else {
        admin = existingAdmin;
      }
    } catch (e) {
      console.warn('Failed to query Supabase admins table:', e.message);
    }

    // Fallback: check local MongoDB collection if not found in Supabase
    if (!admin) {
      admin = await Admin.findOne({ email });
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid administrative email or password.' });
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative email or password.' });
    }

    // Sign admin token
    const token = generateToken({ id: admin.id || admin._id, role: admin.role || 'admin' });

    return res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully.',
      token,
      admin: {
        id: admin.id || admin._id,
        email: admin.email,
        role: admin.role || 'admin'
      }
    });

  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

/**
 * Get profile details of authenticated Admin
 */
const profile = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
};

/**
 * Gather Dashboard aggregation statistics for the Admin desk
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({ orderStatus: { $ne: 'Delivered' } });
    const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // Aggregate total revenue
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Daily statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    
    const todayRevenueResult = await Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalRevenue,
        todayOrders,
        todayRevenue
      }
    });

  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error loading dashboard metrics.' });
  }
};

module.exports = {
  login,
  profile,
  getDashboardStats
};
