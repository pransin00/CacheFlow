import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import logo from "../../assets/CacheFlow_Logo.png";
import "./Signup.css";

const Signup = () => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'signup'
  const [contactNumber, setContactNumber] = useState("");
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentOtp, setSentOtp] = useState('');
  const [timer, setTimer] = useState(45);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Timer countdown for OTP
  React.useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  // Handle phone number submission and send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!contactNumber || contactNumber.trim() === '') {
      setError('Contact number is required');
      return;
    }

    // Validate phone number format (Philippine number)
    if (!/^\+639\d{9}$/.test(contactNumber)) {
      setError('Invalid format. Use +639XXXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      // Check if contact number already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("contact_number")
        .eq("contact_number", contactNumber)
        .single();

      if (existingUser) {
        setError("This contact number is already registered");
        setLoading(false);
        return;
      }

      // Send OTP to phone number
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: [contactNumber] })
      });

      const result = await response.json();

      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setTimer(45);
        setStep('otp');
        setInfo('OTP sent to your phone.');
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
    setLoading(false);
  }

  // Handle OTP input change
  const handleOtpChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1].focus();
    }
  };

  // Handle OTP verification
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    const entered = otp.join('').trim();
    const expected = (sentOtp || '').toString().trim();

    if (entered === '') {
      setError('OTP required');
      return;
    }

    if (entered === expected && expected !== '') {
      setInfo('Phone verified! Please create your account.');
      setStep('signup');
    } else {
      setError('Invalid OTP code');
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: [contactNumber] })
      });

      const result = await response.json();

      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setTimer(45);
        setInfo('OTP resent to your phone.');
      } else {
        setError('Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (!username || username.trim() === '') {
      setError('Username is required');
      return;
    }
    if (!password || password.trim() === '') {
      setError('Password is required');
      return;
    }
    if (!confirmPassword || confirmPassword.trim() === '') {
      setError('Please confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUser) {
        setError("Username already exists");
        setLoading(false);
        return;
      }

      // Create new user with verified contact number
      const { error: insertError } = await supabase
        .from("users")
        .insert([{
          username: username,
          password: password,
          contact_number: contactNumber,
          role: 'user'
        }]);

      if (insertError) {
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      setInfo('Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Render phone verification step
  if (step === 'phone') {
    return (
      <div className="signup-root">
        <div className="signup-container">
          <div className="signup-left">
            <img src={logo} alt="CacheFlow Logo" className="signup-logo" />
            <div className="signup-description">
              Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
            </div>
          </div>

          <div className="signup-right">
            <div className="signup-card">
              <h2 className="signup-title">Verify Phone</h2>
              <form onSubmit={handleSendOtp}>
                <div className="signup-field">
                  <label>Contact Number</label>
                  <div className="signup-input-wrapper">
                    <input
                      type="text"
                      placeholder="+639XXXXXXXXX"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                      className="signup-input"
                    />
                    <span className="signup-input-icon">📱</span>
                  </div>
                </div>

                {error && <div className="signup-error">{error}</div>}
                {info && <div className="signup-success">{info}</div>}
                <button type="submit" className="signup-button" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render OTP verification step
  if (step === 'otp') {
    return (
      <div className="signup-root">
        <div className="signup-container">
          <div className="signup-left">
            <img src={logo} alt="CacheFlow Logo" className="signup-logo" />
            <div className="signup-description">
              Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
            </div>
          </div>

          <div className="signup-right">
            <div className="signup-card">
              <h2 className="signup-title">Enter OTP</h2>
              <p className="signup-subtitle">We sent a code to {contactNumber}</p>
              <form onSubmit={handleVerifyOtp}>
                <div className="otp-container">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="otp-box"
                    />
                  ))}
                </div>

                {error && <div className="signup-error">{error}</div>}
                {info && <div className="signup-success">{info}</div>}
                
                <div className="otp-timer">
                  {timer > 0 ? (
                    <span>Resend OTP in {timer}s</span>
                  ) : (
                    <button type="button" onClick={handleResendOtp} className="resend-link">
                      Resend OTP
                    </button>
                  )}
                </div>

                <button type="submit" className="signup-button">
                  Verify
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render signup form step
  return (
    <div className="signup-root">
      <div className="signup-container">
        <div className="signup-left">
          <img src={logo} alt="CacheFlow Logo" className="signup-logo" />
          <div className="signup-description">
            Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
          </div>
        </div>

        <div className="signup-right">
          <div className="signup-card">
            <h2 className="signup-title">Sign Up</h2>
            <form onSubmit={handleSignup}>
              <div className="signup-field">
                <label>Username</label>
                <div className="signup-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter your Email"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="signup-input"
                  />
                  <span className="signup-input-icon">✉️</span>
                </div>
              </div>

              <div className="signup-field">
                <label>Password</label>
                <div className="signup-input-wrapper">
                  <input
                    type="password"
                    placeholder="Enter your Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="signup-input"
                  />
                  <span className="signup-input-icon">🔒</span>
                </div>
              </div>

              <div className="signup-field">
                <label>Password</label>
                <div className="signup-input-wrapper">
                  <input
                    type="password"
                    placeholder="Enter your Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="signup-input"
                  />
                  <span className="signup-input-icon">🔒</span>
                </div>
              </div>

              {error && <div className="signup-error">{error}</div>}
              {info && <div className="signup-success">{info}</div>}
              <button type="submit" className="signup-button" disabled={loading}>
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
