const rateLimit = require('express-rate-limit');

/**
 * Limit OTP send requests (e.g. max 5 requests per 10 minutes per IP)
 */
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 10 minutes before requesting again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limit OTP verification attempts (e.g. max 15 attempts per 10 minutes per IP)
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter
};
