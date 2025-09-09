// sms-proxy.mjs
// Simple Node.js/Express proxy to forward SMS requests to the cloud SMS gateway (ESM version)

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const CLOUD_API_URL = 'https://api.sms-gate.app/mobile/v1/sms/send';
const CLOUD_API_URL_3RD = 'https://api.sms-gate.app/3rdparty/v1/message';
const USERNAME = '0DAAWJ'; // Your cloud username
const PASSWORD = 'na09xggjkemynj'; // Your cloud password
const basicAuth = 'Basic ' + Buffer.from(USERNAME + ':' + PASSWORD).toString('base64');

app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;
  try {
    const response = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify({ to, message })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-otp', async (req, res) => {
  const { phoneNumbers, message } = req.body;
  try {
    const response = await fetch(CLOUD_API_URL_3RD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify({ phoneNumbers, message })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`SMS proxy server running on http://localhost:${PORT}`);
});
