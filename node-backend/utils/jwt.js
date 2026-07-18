const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforfoodoptimizer12345';

/**
 * Generate a JWT token for a payload
 * @param {object} payload - Mapped details (id, role, etc.)
 * @returns {string} - JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - Header token
 * @returns {object} - Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
