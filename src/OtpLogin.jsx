import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import logo from './assets/CacheFlow_Logo.png';

function generateOTP() {
  // This function is intentionally left empty as OTP generation is now handled by the backend.
  // It's kept to avoid breaking references if they exist, but it does nothing.
  return null;
}

const OtpLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentOtp, setSentOtp] = useState('');
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [info, setInfo] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  const handleChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1].focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setDebugInfo('Login form submitted...');
    setLoading(true);
    
    console.log('Login attempt - Username:', username, 'Password:', password);
    
    // Check username/password in Supabase
    const { data, error: loginError } = await supabase
      .from('users')
      .select('id, contact_number')
      .eq('username', username)
      .eq('password', password)
      .single();
      
    console.log('Supabase query result:', { data, loginError });
    setDebugInfo(`Database query: ${data ? 'User found' : 'No user found'}`);
    
    if (loginError || !data) {
      setError('Invalid username or password');
      setDebugInfo('Login failed - invalid credentials');
      setLoading(false);
      return;
    }

    // Ensure a contact number exists and is not just whitespace
    if (!data.contact_number || data.contact_number.trim() === '') {
      setError('No contact number is associated with this account.');
      setDebugInfo('Login failed - no contact number found for user.');
      setLoading(false);
      return;
    }
    
    const trimmedContactNumber = data.contact_number.trim();

    setContactNumber(trimmedContactNumber);
    setUserId(data.id);
    setDebugInfo(`Contact number: ${trimmedContactNumber}`);
    
    // Request the backend to generate and send the OTP
    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumbers: [trimmedContactNumber]
        })
      });

      const result = await response.json();

      if (response.ok && result.otp) {
        setSentOtp(result.otp); // The backend sends the OTP for frontend comparison
        setTimer(45);
        setStep('otp');
        setInfo('OTP sent to your phone.');
        setDebugInfo(`SMS sent successfully. OTP received for verification.`);
      } else {
        setError('Failed to send OTP.');
        setDebugInfo(result.error || 'An unknown error occurred while sending OTP.');
        setInfo('');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
      setDebugInfo(`Connection error: ${err.message}`);
      setInfo('');
      console.error('Server connection error:', err);
    }
    setLoading(false);
  };

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumbers: [contactNumber]
        })
      });

      const result = await response.json();

      if (response.ok && result.otp) {
        setSentOtp(result.otp); // The backend sends the new OTP
        setTimer(45); // Reset the timer
        setInfo('OTP resent to your phone.');
      } else {
        setError('Failed to resend OTP.');
        setInfo('');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
      setInfo('');
      console.error('Server connection error:', err);
    }
    setLoading(false);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    if (otp.join('') === sentOtp) {
      setSuccess(true);
      // Store user id and navigate to dashboard
      localStorage.setItem('user_id', userId);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000); // Small delay to show success message
    } else {
      setError('Invalid code');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafdff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fafdff' }}>
        {/* Left: Logo and description */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,60,255,0.03)' }}>
          <img src={logo} alt="CacheFlow Logo" style={{ width: '18vw', marginBottom: '2vw' }} />
          <div style={{ maxWidth: 400, fontSize: '1.1vw', color: '#6b6b6b', textAlign: 'center', fontWeight: 400 }}>
            Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with Reen Bank.
          </div>
        </div>
        {/* Right: Login/OTP Verification */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {step === 'login' && (
            <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: '2vw', boxShadow: '0 2px 16px #0001', padding: '3vw 3vw 2vw 3vw', minWidth: 420, maxWidth: 480, width: '32vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.7vw', color: '#1a3185', marginBottom: '1vw', alignSelf: 'flex-start' }}>Login</div>
              <div style={{ color: '#6b6b6b', fontSize: '1vw', marginBottom: '2vw', alignSelf: 'flex-start' }}>
                Enter your username and password to continue
              </div>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', marginBottom: 12, padding: 8, fontSize: '1.1vw', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fafdff', fontWeight: 500 }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', marginBottom: 12, padding: 8, fontSize: '1.1vw', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fafdff', fontWeight: 500 }} />
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.9vw 0', background: '#1a3185', color: '#fff', border: 'none', borderRadius: '0.5vw', fontWeight: 600, fontSize: '1.1vw', marginBottom: '1vw', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              {info && <div style={{ color: '#1976d2', marginTop: 8 }}>{info}</div>}
              {debugInfo && <div style={{ color: '#666', marginTop: 8, fontSize: '0.9vw' }}>{debugInfo}</div>}
            </form>
          )}
          {step === 'otp' && (
            <form onSubmit={handleVerify} style={{ background: '#fff', borderRadius: '2vw', boxShadow: '0 2px 16px #0001', padding: '3vw 3vw 2vw 3vw', minWidth: 420, maxWidth: 480, width: '32vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.7vw', color: '#1a3185', marginBottom: '1vw', alignSelf: 'flex-start' }}>Text Verification</div>
              <div style={{ color: '#6b6b6b', fontSize: '1vw', marginBottom: '2vw', alignSelf: 'flex-start' }}>
                A 6-digit code has been sent to your message <span style={{ color: '#0a3cff', cursor: 'pointer', fontWeight: 500, marginLeft: 8 }}>Change</span>
              </div>
              <div style={{ display: 'flex', gap: '1vw', marginBottom: '1.5vw' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    style={{
                      width: '3vw',
                      height: '3vw',
                      fontSize: '2vw',
                      textAlign: 'center',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '0.7vw',
                      background: '#fafdff',
                      outline: 'none',
                      fontWeight: 700,
                    }}
                  />
                ))}
              </div>
              <div style={{ color: '#1a3185', fontWeight: 500, fontSize: '1vw', marginBottom: '1vw', alignSelf: 'flex-start' }}>
                0:{timer.toString().padStart(2, '0')} remaining
              </div>
              <button type="submit" disabled={loading || success} style={{ width: '100%', padding: '0.9vw 0', background: '#1a3185', color: '#fff', border: 'none', borderRadius: '0.5vw', fontWeight: 600, fontSize: '1.1vw', marginBottom: '1vw', cursor: loading || success ? 'not-allowed' : 'pointer' }}>
                Verify Text
              </button>
              <div style={{ color: '#6b6b6b', fontSize: '0.95vw', marginBottom: '0.5vw' }}>
                Didn’t receive the code? <span style={{ color: '#0a3cff', cursor: timer === 0 ? 'pointer' : 'not-allowed', fontWeight: 500 }} onClick={() => timer === 0 && handleSendOtp()}>Resend</span>
              </div>
              {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              {success && <div style={{ color: 'green', marginTop: 8 }}>Verified! Login successful.</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpLogin;
