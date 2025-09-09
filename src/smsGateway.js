// smsGateway.js
// Utility for sending SMS via android-sms-gateway API (Local Server with Basic Auth)

const API_URL = 'http://192.168.1.173:8080/v1/sms/send'; // Local server endpoint
const USERNAME = 'cacheflow';
const PASSWORD = 'cacheflow123'; // From app screenshot
const basicAuth = 'Basic ' + btoa(USERNAME + ':' + PASSWORD);

/**
 * Send an SMS using the android-sms-gateway API (Cloud Server)
 * @param {string} to - Recipient phone number (e.g. '+1234567890')
 * @param {string} message - The SMS message text
 * @returns {Promise<object>} - API response
 */
export async function sendSMS(to, message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': basicAuth
    },
    body: JSON.stringify({ to, message })
  });
  const data = await response.json();
  return data;
}

/**
 * Send an OTP SMS using the /3rdparty/v1/message endpoint (multiple recipients)
 * @param {string[]} phoneNumbers - Array of recipient phone numbers
 * @param {string} message - The SMS message text
 * @returns {Promise<object>} - API response
 */
export async function sendOTP(phoneNumbers, message) {
  const OTP_API_URL = 'http://localhost:5000/send-otp';
  const response = await fetch(OTP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phoneNumbers, message })
  });
  const data = await response.json();
  return data;
}

// Example usage (uncomment to test):
// sendSMS('+1234567890', 'Hello from CacheFlow!').then(console.log).catch(console.error);
// sendOTP(['+1234567890', '+0987654321'], 'Your OTP code is 123456').then(console.log).catch(console.error);
