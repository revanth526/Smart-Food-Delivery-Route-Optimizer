const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../services/otpService');
const { sendOTP } = require('../services/smsService');
const { generateToken } = require('../utils/jwt');
const supabase = require('../supabase');

/**
 * Handles generating and sending a 6-digit OTP to a customer
 */
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }

    const cleanPhone = phone.trim();

    // Check if an OTP record already exists for this phone number
    const existingOtp = await Otp.findOne({ phone: cleanPhone });
    if (existingOtp) {
      const timeElapsed = (Date.now() - existingOtp.lastSentAt.getTime()) / 1000;
      // Allow resending OTP only after 60 seconds
      if (timeElapsed < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeElapsed)} seconds before requesting a new OTP.`
        });
      }
    }

    // Generate secure random 6-digit OTP
    const rawOtp = generateOTP();
    const hashed = hashOTP(rawOtp);
    const expiration = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration time

    if (existingOtp) {
      // Update existing record
      existingOtp.otpHash = hashed;
      existingOtp.expiresAt = expiration;
      existingOtp.attempts = 0; // Reset verification attempt counter
      existingOtp.lastSentAt = new Date();
      await existingOtp.save();
    } else {
      // Create new record
      await Otp.create({
        phone: cleanPhone,
        otpHash: hashed,
        expiresAt: expiration,
        attempts: 0,
        lastSentAt: new Date()
      });
    }

    // Always print OTP in server console for inspection
    console.log(`\n==================================================`);
    console.log(`🔑 [SECURITY LOG] Secure OTP generated for ${cleanPhone}: ${rawOtp}`);
    console.log(`==================================================\n`);

    // Call placeholder SMS service
    await sendOTP(cleanPhone, rawOtp);

    // Differentiate response payload based on NODE_ENV
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: 'OTP generated successfully (Development Mode).',
        otp: rawOtp
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully.'
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error processing OTP.' });
  }
};

/**
 * Handles verifying the OTP code submitted by a customer
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and verification OTP are required.' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    // Check if OTP record exists
    const otpRecord = await Otp.findOne({ phone: cleanPhone });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP code has expired or is invalid.' });
    }

    // Limit verification attempts to 5
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id }); // Delete OTP on security breach
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Validate the OTP hash
    const inputHash = hashOTP(cleanOtp);
    if (inputHash !== otpRecord.otpHash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    // OTP verified successfully - Delete it from database
    await Otp.deleteOne({ _id: otpRecord._id });

    // Store/Retrieve user using Supabase instead of MongoDB
    let user = null;
    try {
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (userError) {
        console.warn('Supabase query error, falling back to local fallback:', userError.message);
      } else {
        user = existingUser;
      }
    } catch (e) {
      console.warn('Failed to query Supabase users table:', e.message);
    }

    if (!user) {
      const defaultName = `Customer-${cleanPhone.substring(cleanPhone.length - 4)}`;
      try {
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            phone: cleanPhone,
            name: defaultName,
            role: 'customer'
          })
          .select()
          .single();

        if (insertError) {
          console.warn('Supabase user creation error, using local fallback:', insertError.message);
          user = {
            id: 'mock-sb-' + Date.now(),
            phone: cleanPhone,
            name: defaultName,
            role: 'customer'
          };
        } else {
          user = insertedUser;
        }
      } catch (e) {
        user = {
          id: 'mock-sb-' + Date.now(),
          phone: cleanPhone,
          name: defaultName,
          role: 'customer'
        };
      }
    }

    // Generate JWT token
    const token = generateToken({ id: user.id || user._id, role: user.role || 'customer' });

    return res.status(200).json({
      success: true,
      message: 'Verification successful.',
      token,
      user: {
        id: user.id || user._id,
        phone: user.phone,
        name: user.name,
        role: user.role || 'customer'
      }
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error verifying OTP.' });
  }
};

/**
 * Retrieves all active OTP records (phone and creation timestamp) for feed visualizers
 */
const getActiveOtps = async (req, res) => {
  try {
    const records = await Otp.find({}, 'phone lastSentAt');
    // Map entries to format used by Login.jsx. 
    // Since codes are hashed, we represent them as "******" for security compliance.
    const mapped = records.map(r => ({
      _id: r._id,
      phone: r.phone,
      otp: '******',
      createdAt: r.lastSentAt
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    return res.status(500).json([]);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getActiveOtps
};
