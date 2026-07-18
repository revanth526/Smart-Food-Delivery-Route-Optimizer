const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getActiveOtps } = require('../controllers/authController');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

// OTP endpoints
router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.get('/active-otps', getActiveOtps);

module.exports = router;
