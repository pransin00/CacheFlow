import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

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

  const { phoneNumbers } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    console.error('Validation failed: phoneNumbers is missing, not an array, or empty.');
    return res.status(400).json({ error: 'phoneNumbers field is required and must be a non-empty array.' });
  }

  const otp = generateOTP();
  const text = `Your OTP is: ${otp}`;
  console.log(`Generated OTP ${otp} for numbers: ${phoneNumbers.join(', ')}`);

  try {
    const response = await fetch('https://api.sms-gate.app/3rdparty/v1/messages', {
      method: 'POST',
      headers: {
         'Authorization': 'Basic ' + Buffer.from('DCM8CD:vk_nl23nyjvvzl').toString('base64'),
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
