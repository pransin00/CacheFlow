import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import logo from "../../assets/CacheFlow_Logo.png";
import "./SetupAccount.css";

const SetupAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
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
  const navigate = useNavigate();

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
      // Update username, password and pin, clear setup_token
      const { error: updateError } = await supabase
        .from("users")
        .update({ username: username.trim(), password: password, pin, setup_token: null })
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
          Welcome! Create your username and set a strong password and PIN to activate your account.
        </div>
      </div>
      <div className="setup-container">
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
                <span className="setup-toggle-icon" style={{pointerEvents: 'none'}}>👤</span>
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
                <span className="setup-toggle-icon" onClick={() => setShowPassword(p => !p)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? '👁️' : '🙈'}</span>
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
                <span className="setup-toggle-icon" onClick={() => setShowConfirmPassword(p => !p)} title={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? '👁️' : '🙈'}</span>
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
                <span className="setup-toggle-icon" onClick={() => setShowPin(p => !p)} title={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? '👁️' : '🙈'}</span>
              </div>
            </div>
            {error && <div className="setup-error">{error}</div>}
            <button type="submit" className="setup-button" disabled={loading}>{loading ? "Setting up..." : "Set Up Account"}</button>
          </form>
        </div>
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
