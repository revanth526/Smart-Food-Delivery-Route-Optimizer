const crypto = require('crypto');

/**
 * Cryptographically secure random 6-digit OTP generator
 * @returns {string} - 6 digit numeric code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * SHA-256 Hashing for OTP storage safety
 * @param {string} otp - Unhashed code
 * @returns {string} - Hex digest hash
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = {
  generateOTP,
  hashOTP
};
