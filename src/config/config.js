// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ENDPOINTS = {
  SEND_OTP: `${API_URL}/api/send-otp`,
  SEND_SETUP_SMS: `${API_URL}/api/send-setup-sms`
};
