const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Express middleware to authenticate Customer JWT sessions
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required. Access Denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // Find customer in database
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Forbidden. Invalid customer session.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Customer Auth Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

module.exports = authMiddleware;
