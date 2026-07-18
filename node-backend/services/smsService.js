/**
 * SMS Dispatch Service
 * Responsible for transmitting OTP codes to customer mobile devices.
 */
const twilio = require('twilio');

// Initialize Twilio Client using production environment credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Instantiate the Twilio client only if credentials are provided to prevent server crashes
let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
  }
}

/**
 * Sends a 6-digit OTP code to the customer's phone number.
 * @param {string} phone - Target customer mobile number.
 * @param {string} otp - Unhashed 6-digit OTP code.
 * @returns {Promise<boolean>}
 */
const sendOTP = async (phone, otp) => {
  // Check if we are running in production and Twilio credentials are ready
  if (process.env.NODE_ENV === 'production' && client) {
    try {
      // Ensure phone number starts with a country code (defaults to +91 if 10-digits)
      const formattedPhone = phone.startsWith('+') 
        ? phone 
        : (phone.length === 10 ? `+91${phone}` : phone);

      await client.messages.create({
        body: `Your SmartFood verification code is: ${otp}. Valid for 5 minutes.`,
        to: formattedPhone,
        from: twilioNumber
      });
      
      console.log(`📡 [SMS PORTAL] Real SMS successfully transmitted via Twilio to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error('❌ Twilio SMS Transmission Failed:', error.message);
      return false;
    }
  }

  // Fallback / Development Simulation mode
  console.log(`\n==================================================`);
  console.log(`📱 [SMS SIMULATION] Sending OTP to ${phone}`);
  console.log(`💬 MSG: Your verification code is: ${otp}`);
  console.log(`==================================================\n`);

  return true;
};

module.exports = {
  sendOTP
};
