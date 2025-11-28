import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { hashPassword } from "../../utils/hashUtils";
import logo from "../../assets/CacheFlow_Logo.png";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    // respect lockout
    if (lockUntil && Date.now() < lockUntil) {
      setError(`Too many failed attempts. Try again in ${Math.ceil((lockUntil - Date.now()) / 1000)}s`);
      return;
    }
    // Validate required fields
    if (!username || username.trim() === '') {
      setError('Username is required');
      return;
    }
    if (!password || password.trim() === '') {
      setError('Password is required');
      return;
    }

    // Query database by username only, then verify password in JS
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
    
    // Hash the entered password and compare (with plain text fallback)
    const hashedPassword = await hashPassword(password);
    const passwordMatch = data && (data.password === hashedPassword || data.password === password);
      
    if (error || !data || !passwordMatch) {
      // increment attempts
      const next = attempts + 1;
      setAttempts(next);
      localStorage.setItem('cf_login_attempts', String(next));
      if (next >= 3) {
        const until = Date.now() + 60_000; // 1 minute
        setLockUntil(until);
        localStorage.setItem('cf_login_lock_until', String(until));
        setRemaining(60);
        setError('Too many failed attempts. Try again in 60s');
      } else {
        setError("Invalid username or password");
      }
      return;
    }

    // Check if user has setup_token - means they haven't completed account setup
    if (data.setup_token) {
      setError('Account setup not completed. Please check your SMS for the setup link.');
      return;
    }

    localStorage.setItem('user_id', data.id);

    // Check if user is admin
    if (data.role === 'admin') {
      // For admin, ask for superpassword (PIN)
      const superpassword = prompt('Enter superpassword (PIN):');
      const hashedSuperpass = await hashPassword(superpassword);
      const pinMatch = hashedSuperpass === data.pin || superpassword === data.pin;
      if (superpassword && pinMatch) {
        // Admin authenticated successfully
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('user_role', data.role);
        // reset attempt counters on success
        setAttempts(0);
        localStorage.removeItem('cf_login_attempts');
        setLockUntil(null);
        localStorage.removeItem('cf_login_lock_until');
        navigate('/admin');
        return;
      } else {
        setError('Invalid superpassword');
        return;
      }
    }

    // For regular users, continue with OTP flow
    // Store user credentials for OTP verification
    localStorage.setItem('pending_login_username', username);
    localStorage.setItem('pending_login_password', password);
    
    // reset attempt counters on success
    setAttempts(0);
    localStorage.removeItem('cf_login_attempts');
    setLockUntil(null);
    localStorage.removeItem('cf_login_lock_until');
    
    navigate('/otp-login');
  }

  // initialize attempts/lock from localStorage
  React.useEffect(() => {
    const a = parseInt(localStorage.getItem('cf_login_attempts') || '0', 10) || 0;
    const until = parseInt(localStorage.getItem('cf_login_lock_until') || '0', 10) || null;
    setAttempts(a);
    if (until && until > Date.now()) {
      setLockUntil(until);
      setRemaining(Math.ceil((until - Date.now()) / 1000));
    } else {
      // clear stale lock
      localStorage.removeItem('cf_login_lock_until');
    }
  }, []);

  // countdown effect while locked
  React.useEffect(() => {
    if (!lockUntil) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setLockUntil(null);
        setAttempts(0);
        localStorage.removeItem('cf_login_attempts');
        localStorage.removeItem('cf_login_lock_until');
        clearInterval(iv);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockUntil]);

  // keep error message as the live countdown while locked
  React.useEffect(() => {
    if (lockUntil && remaining > 0) {
      setError(`Too many failed attempts. Try again in ${remaining}s`);
    } else if (!lockUntil) {
      // if the current error is the lock message, clear it when lock ends
      setError(prev => (prev && prev.startsWith('Too many failed attempts') ? '' : prev));
    }
  }, [lockUntil, remaining]);

  return (
    <div className="login-root">
      <div className="login-shell">
        <div className="login-left">
          <img src={logo} alt="CacheFlow Logo" className="login-logo" />
          <div className="login-blurb">
            Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
          </div>
        </div>

        <div className="login-right">
          <div className="login-panel">
            <h2 className="login-title">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Username</label>
                <div className="input-wrap">
                  <input
                    type="text"
                    placeholder="Enter your Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input"
                  />
                  <span className="input-icon">👤</span>
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input"
                  />
                  <span className="toggle" onClick={() => setShowPassword(prev => !prev)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? '👁️' : '🙈'}</span>
                  <a href="#" className="forgot">Forgot?</a>
                </div>
              </div>

              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn-submit" disabled={lockUntil && Date.now() < lockUntil}>Login</button>
            </form>
            <div className="register-cta">
              Don't Have an Account? <a href="#">Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
