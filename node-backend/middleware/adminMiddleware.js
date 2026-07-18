const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

/**
 * Express middleware to authenticate and restrict routes strictly to Administrators
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access Denied. Admin authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify admin details in DB
    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to system administrators.' });
    }

    req.user = admin;
    next();
  } catch (err) {
    console.error('Admin Auth Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired Admin credentials.' });
  }
};

module.exports = adminMiddleware;
