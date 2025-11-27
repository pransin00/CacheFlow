import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import logo from "../../assets/CacheFlow_Logo.png";
import "./SetupAccount.css";

const SetupAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSetup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
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
      // Update password and pin, clear setup_token
      const { error: updateError } = await supabase
        .from("users")
        .update({ password: password, pin, setup_token: null })
        .eq("id", userData.id);
      if (updateError) {
        setError("Failed to set up account. Try again.");
        setLoading(false);
        return;
      }
      setSuccess("Account setup complete! You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("Unexpected error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-root">
      <div className="setup-container">
        <div className="setup-left">
          <img src={logo} alt="CacheFlow Logo" className="setup-logo" />
          <div className="setup-description">
            Welcome! Set your password and PIN to activate your account.
          </div>
        </div>
        <div className="setup-right">
          <div className="setup-card">
            <h2 className="setup-title">Account Setup</h2>
            <form onSubmit={handleSetup}>
              <div className="setup-field">
                <label>New Password</label>
                <div className="setup-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="setup-input"
                  />
                  <span className="setup-toggle-icon" onClick={() => setShowPassword(p => !p)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? '👁️' : '🙈'}</span>
                </div>
              </div>
              <div className="setup-field">
                <label>New PIN</label>
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
              {success && <div className="setup-success">{success}</div>}
              <button type="submit" className="setup-button" disabled={loading}>{loading ? "Setting up..." : "Set Up Account"}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupAccount;
