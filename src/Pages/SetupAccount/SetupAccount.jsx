import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { hashPassword } from "../../utils/hashUtils";
import logo from "../../assets/CacheFlow_Logo.png";
import userIcon from "../../assets/user.png";
import viewIcon from "../../assets/view.png";
import hideIcon from "../../assets/hide.png";
import "./SetupAccount.css";

const SetupAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [step, setStep] = useState('otp'); // 'otp' | 'setup'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentOtp, setSentOtp] = useState('');
  const [timer, setTimer] = useState(45);
  const [contactNumber, setContactNumber] = useState('');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [lockRemaining, setLockRemaining] = useState(0);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Fetch user contact number on mount (OTP already sent during account creation)
  useEffect(() => {
    async function initSetup() {
      if (!token) {
        setError("Invalid or missing setup token.");
        return;
      }
      
      try {
        // Get user contact number and OTP
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("contact_number, password")
          .eq("setup_token", token)
          .single();
        
        if (userError || !userData) {
          setError("Invalid or expired setup link.");
          return;
        }
        
        setContactNumber(userData.contact_number);
        // The OTP was sent during account creation and stored in password field
        setSentOtp(userData.password || '');
      } catch (err) {
        setError("Failed to initialize setup.");
      }
    }
    
    initSetup();
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  // Lock countdown
  useEffect(() => {
    if (lockUntil && lockUntil > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining > 0) {
          setLockRemaining(remaining);
        } else {
          setLockUntil(null);
          setLockRemaining(0);
          setOtpAttempts(0);
          localStorage.removeItem('cf_setup_otp_attempts');
          localStorage.removeItem('cf_setup_otp_lock_until');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockUntil]);

  // Initialize attempts from localStorage
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('cf_setup_otp_attempts') || '0', 10);
    const lockTime = parseInt(localStorage.getItem('cf_setup_otp_lock_until') || '0', 10);
    setOtpAttempts(attempts);
    if (lockTime > Date.now()) {
      setLockUntil(lockTime);
      setLockRemaining(Math.ceil((lockTime - Date.now()) / 1000));
    }
  }, []);

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

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    
    // Check if locked
    if (lockUntil && Date.now() < lockUntil) {
      setError(`Too many failed attempts. Try again in ${lockRemaining}s`);
      return;
    }
    
    const entered = otp.join('').trim();
    const expected = (sentOtp || '').toString().trim();
    
    console.log('Entered OTP:', entered);
    console.log('Expected OTP:', expected);
    console.log('Match:', entered === expected);
    
    if (entered === '') {
      setError('Please enter the OTP code.');
      return;
    }
    
    if (entered === expected && expected !== '') {
      // Success - reset attempts
      setOtpAttempts(0);
      setLockUntil(null);
      setLockRemaining(0);
      localStorage.removeItem('cf_setup_otp_attempts');
      localStorage.removeItem('cf_setup_otp_lock_until');
      setStep('setup');
    } else {
      // Failed - increment attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      localStorage.setItem('cf_setup_otp_attempts', String(newAttempts));
      
      if (newAttempts >= 3) {
        const lockTime = Date.now() + 60_000; // 1 minute
        setLockUntil(lockTime);
        setLockRemaining(60);
        localStorage.setItem('cf_setup_otp_lock_until', String(lockTime));
        setError('Too many failed attempts. Try again in 60s');
      } else {
        setError('Invalid OTP code. Please try again.');
      }
    }
  }

  async function handleResendOtp() {
    setError('');
    
    // Check if locked
    if (lockUntil && Date.now() < lockUntil) {
      setError(`Resend disabled. Try again in ${lockRemaining}s`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Send only OTP code via SMS (no setup link)
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumbers: [contactNumber],
          message: `Your CacheFlow verification code is: {{OTP}}` // Custom message without link
        })
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.otp) {
        setSentOtp(responseData.otp.toString());
        setTimer(45);
        setOtp(['', '', '', '', '', '']);
        console.log('OTP resent:', responseData.otp);
        
        // Update OTP in database
        await supabase
          .from('users')
          .update({ password: responseData.otp.toString() })
          .eq('setup_token', token);
      } else {
        setError('Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Username validation
    if (!username || username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    
    // Check if username already exists
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username.trim())
        .limit(1);
      
      if (checkError) {
        setError("Failed to validate username. Try again.");
        return;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        setError("Username already exists. Please choose another.");
        return;
      }
    } catch (err) {
      setError("Failed to validate username. Try again.");
      return;
    }
    
    // Strong password validation
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    // Check for strong password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError("Password must contain uppercase, lowercase, number, and special character.");
      return;
    }
    
    // Password confirmation validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (!pin || pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
      setError("PIN must be a 4-digit number.");
      return;
    }
    if (!token) {
      setError("Invalid or missing setup token.");
      return;
    }
    setLoading(true);
    try {
      // Find user by token
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("setup_token", token)
        .single();
      if (userError || !userData) {
        setError("Invalid or expired setup link.");
        setLoading(false);
        return;
      }
      // Hash password and PIN before saving
      const hashedPassword = await hashPassword(password);
      const hashedPin = await hashPassword(pin);
      
      // Update username, password and pin, clear setup_token
      const { error: updateError } = await supabase
        .from("users")
        .update({ username: username.trim(), password: hashedPassword, pin: hashedPin, setup_token: null })
        .eq("id", userData.id);
      if (updateError) {
        setError("Failed to set up account. Try again.");
        setLoading(false);
        return;
      }
      
      // Store user_id for auto-login to dashboard
      localStorage.setItem('user_id', userData.id);
      
      // Show success modal
      setLoading(false);
      setShowSuccessModal(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Unexpected error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="setup-root">
      <div className="setup-header">
        <img src={logo} alt="CacheFlow Logo" className="setup-logo" />
        <div className="setup-description">
          {step === 'otp' 
            ? 'Please verify your phone number with the OTP code sent to your device.' 
            : 'Create your username and set a strong password and PIN to activate your account.'}
        </div>
      </div>
      <div className="setup-container">
        {step === 'otp' && (
          <div className="setup-card">
            <h2 className="setup-title">Verify OTP</h2>
            <p className="setup-subtitle">A 6-digit code has been sent to {contactNumber}</p>
            <form onSubmit={handleVerifyOtp}>
              <div className="otp-inputs">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="otp-digit"
                  />
                ))}
              </div>
              <div className="otp-timer">0:{timer.toString().padStart(2, '0')} remaining</div>
              <button type="submit" className="setup-button" disabled={loading || (lockUntil && Date.now() < lockUntil)}>
                {lockUntil && Date.now() < lockUntil ? `Locked (${lockRemaining}s)` : 'Verify OTP'}
              </button>
              <div className="otp-resend">
                Didn't receive the code? {
                  (timer === 0 && (!lockUntil || Date.now() >= lockUntil)) ? (
                    <span className="otp-resend-link" onClick={handleResendOtp}>Resend</span>
                  ) : (
                    <span className="otp-resend-disabled">
                      {lockUntil && Date.now() < lockUntil ? `Locked (${lockRemaining}s)` : 'Resend'}
                    </span>
                  )
                }
              </div>
              {error && <div className="setup-error">{error}</div>}
            </form>
          </div>
        )}

        {step === 'setup' && (
          <div className="setup-card">
            <h2 className="setup-title">Account Setup</h2>
            <form onSubmit={handleSetup}>
            <div className="setup-field">
              <label>Username</label>
              <div className="setup-input-wrapper">
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="setup-input"
                />
                <img src={userIcon} alt="User" className="setup-icon" />
              </div>
            </div>
            <div className="setup-field">
              <label>Password</label>
              <div className="setup-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="setup-input"
                />
                <img 
                  src={showPassword ? viewIcon : hideIcon} 
                  alt={showPassword ? "Hide" : "Show"} 
                  className="setup-icon-toggle" 
                  onClick={() => setShowPassword(p => !p)} 
                  title={showPassword ? "Hide password" : "Show password"}
                />
              </div>
            </div>
            <div className="setup-field">
              <label>Confirm Password</label>
              <div className="setup-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="setup-input"
                />
                <img 
                  src={showConfirmPassword ? viewIcon : hideIcon} 
                  alt={showConfirmPassword ? "Hide" : "Show"} 
                  className="setup-icon-toggle" 
                  onClick={() => setShowConfirmPassword(p => !p)} 
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                />
              </div>
            </div>
            <div className="setup-field">
              <label>PIN</label>
              <div className="setup-input-wrapper">
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,4))}
                  className="setup-input"
                />
                <img 
                  src={showPin ? viewIcon : hideIcon} 
                  alt={showPin ? "Hide" : "Show"} 
                  className="setup-icon-toggle" 
                  onClick={() => setShowPin(p => !p)} 
                  title={showPin ? "Hide PIN" : "Show PIN"}
                />
              </div>
            </div>
            {error && <div className="setup-error">{error}</div>}
            <button type="submit" className="setup-button" disabled={loading}>{loading ? "Setting up..." : "Set Up Account"}</button>
          </form>
        </div>
        )}
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="setup-modal-overlay">
          <div className="setup-modal">
            <div className="setup-modal-icon">✓</div>
            <h3 className="setup-modal-title">Successfully Set Up!</h3>
            <p className="setup-modal-message">Your account has been created. Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupAccount;
