import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/api/send-otp', async (req, res) => {
  console.log('--- New request to /api/send-otp ---');
  console.log('Received request body:', req.body);

  const { phoneNumbers, customMessage } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    console.error('Validation failed: phoneNumbers is missing, not an array, or empty.');
    return res.status(400).json({ error: 'phoneNumbers field is required and must be a non-empty array.' });
  }

  const otp = generateOTP();
  // If customMessage is provided, replace {OTP} placeholder, otherwise use default format
  const text = customMessage ? customMessage.replace('{OTP}', otp) : `Your OTP is: ${otp}`;
  console.log(`Generated OTP ${otp} for numbers: ${phoneNumbers.join(', ')}`);
  console.log(`Message text: ${text}`);

  try {
    // Read API credentials from environment variable (SMS_API_KEY)
    const smsKey = process.env.SMS_API_KEY;
    if (!smsKey) {
      console.error('SMS_API_KEY not set in environment; aborting SMS send');
      return res.status(500).json({ error: 'SMS service not configured' });
    }

    const response = await fetch('https://api.sms-gate.app/3rdparty/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(smsKey).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        textMessage: { text },
        phoneNumbers,
        simNumber: 2
      })
    });

    const data = await response.json();
    console.log('SMS Gateway API response status:', response.status);
    console.log('SMS Gateway API response data:', data);

    if (response.ok) {
      res.status(response.status).json({ ...data, otp });
    } else {
      res.status(response.status).json(data);
    }
  } catch (err) {
    console.error('Error while contacting SMS Gateway:', err);
    res.status(500).json({ error: 'Failed to send OTP. ' + err.message });
  }
});

// New endpoint for sending custom SMS messages (like setup links)
app.post('/api/send-setup-sms', async (req, res) => {
  console.log('--- New request to /api/send-setup-sms ---');
  console.log('Received request body:', req.body);

  const { phoneNumbers, message } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    console.error('Validation failed: phoneNumbers is missing, not an array, or empty.');
    return res.status(400).json({ error: 'phoneNumbers field is required and must be a non-empty array.' });
  }

  if (!message || typeof message !== 'string') {
    console.error('Validation failed: message is missing or not a string.');
    return res.status(400).json({ error: 'message field is required and must be a string.' });
  }

  console.log(`Sending setup SMS to numbers: ${phoneNumbers.join(', ')}`);
  console.log(`Message: ${message}`);

  try {
    // Read API credentials from environment variable (SMS_API_KEY)
    const smsKey = process.env.SMS_API_KEY;
    if (!smsKey) {
      console.error('SMS_API_KEY not set in environment; aborting SMS send');
      return res.status(500).json({ error: 'SMS service not configured' });
    }

    const response = await fetch('https://api.sms-gate.app/3rdparty/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(smsKey).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        textMessage: { text: message },
        phoneNumbers,
        simNumber: 2
      })
    });

    const data = await response.json();
    console.log('SMS Gateway API response status:', response.status);
    console.log('SMS Gateway API response data:', data);

    if (response.ok) {
      res.status(response.status).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (err) {
    console.error('Error while contacting SMS Gateway:', err);
    res.status(500).json({ error: 'Failed to send SMS. ' + err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
