// Example SMS sending utility using a generic SMS gateway API
// Replace with your actual SMS gateway endpoint and credentials

export async function sendSms(phone, message) {
  // Example: POST to your SMS gateway
  const response = await fetch('https://your-sms-gateway.example/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY', // Replace with your actual key
    },
    body: JSON.stringify({
      to: phone,
      message,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to send SMS');
  }
  return await response.json();
}
