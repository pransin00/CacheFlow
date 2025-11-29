import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import logo from "../../assets/CacheFlow_Logo.png";
import viewIcon from "../../assets/view.png";
import hideIcon from "../../assets/hide.png";
import "./CheckBalance.css";

const CheckBalance = () => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();

  async function handleCheckBalance(e) {
    e.preventDefault();
    setError("");
    setUserData(null);
    
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
    if (!pin || pin.trim() === '') {
      setError('PIN is required');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    // Query database by username - check credentials first
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, firstname, lastname, pin, setup_token")
      .eq("username", username)
      .single();
    
    console.log('=== Check Balance Debug ===');
    console.log('User query result:', userData);
    console.log('User query error:', userError);
    console.log('Entered PIN:', pin);
    console.log('Stored PIN:', userData?.pin);
    
    // Verify PIN (stored as plain 4-digit number, ensure string comparison)
    const pinMatch = userData && String(userData.pin) === String(pin);
      
    if (userError || !userData || !pinMatch) {
      // increment attempts
      const next = attempts + 1;
      setAttempts(next);
      localStorage.setItem('cf_balance_attempts', String(next));
      if (next >= 3) {
        const until = Date.now() + 60_000; // 1 minute
        setLockUntil(until);
        localStorage.setItem('cf_balance_lock_until', String(until));
        setRemaining(60);
        setError('Too many failed attempts. Try again in 60s');
      } else {
        setError("Invalid username or PIN");
      }
      return;
    }

    // Check if user has setup_token - means they haven't completed account setup
    if (userData.setup_token) {
      setError('Account setup not completed. Please check your SMS for the setup link.');
      return;
    }

    // Now fetch balance from accounts table
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("account_number, balance")
      .eq("user_id", userData.id)
      .single();
    
    console.log('Account query result:', accountData);
    console.log('Account query error:', accountError);

    if (accountError || !accountData) {
      setError('Unable to fetch account information.');
      return;
    }

    // Combine user and account data
    const combinedData = {
      ...userData,
      account_number: accountData.account_number,
      balance: accountData.balance
    };

    console.log('Combined data:', combinedData);

    // Set user data to show dashboard
    setUserData(combinedData);
    
    // reset attempt counters on success
    setAttempts(0);
    localStorage.removeItem('cf_balance_attempts');
    setLockUntil(null);
    localStorage.removeItem('cf_balance_lock_until');
  }

  // initialize attempts/lock from localStorage
  useEffect(() => {
    const a = parseInt(localStorage.getItem('cf_balance_attempts') || '0', 10) || 0;
    const until = parseInt(localStorage.getItem('cf_balance_lock_until') || '0', 10) || null;
    setAttempts(a);
    if (until && until > Date.now()) {
      setLockUntil(until);
      setRemaining(Math.ceil((until - Date.now()) / 1000));
    } else {
      // clear stale lock
      localStorage.removeItem('cf_balance_lock_until');
    }
  }, []);

  // countdown effect while locked
  useEffect(() => {
    if (!lockUntil) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setLockUntil(null);
        setAttempts(0);
        localStorage.removeItem('cf_balance_attempts');
        localStorage.removeItem('cf_balance_lock_until');
        clearInterval(iv);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockUntil]);

  // keep error message as the live countdown while locked
  useEffect(() => {
    if (lockUntil && remaining > 0) {
      setError(`Too many failed attempts. Try again in ${remaining}s`);
    } else if (!lockUntil) {
      // if the current error is the lock message, clear it when lock ends
      setError(prev => (prev && prev.startsWith('Too many failed attempts') ? '' : prev));
    }
  }, [lockUntil, remaining]);

  function handleLogout() {
    setUserData(null);
    setUsername('');
    setPin('');
    navigate('/login');
  }

  // If user data is loaded, show the dashboard view
  if (userData) {
    return (
      <div className="balance-dashboard">
        <div className="balance-sidebar">
          <img src={logo} alt="CacheFlow Logo" className="balance-sidebar-logo" />
          <div className="balance-nav">
            <div className="balance-nav-item active">
              <span className="balance-nav-icon">📊</span>
              <span>Overview</span>
            </div>
          </div>
          <div className="balance-logout" onClick={handleLogout}>
            <span className="balance-logout-icon">←</span>
            <span>Logout</span>
          </div>
        </div>
        
        <div className="balance-main">
          <div className="balance-header">
            <h1 className="balance-page-title">Overview</h1>
            <div className="balance-user-info">
              <div className="balance-user-name">
                {userData.firstname && userData.lastname 
                  ? `${userData.firstname} ${userData.lastname}` 
                  : userData.username}
              </div>
              <div className="balance-account-num">{userData.account_number || 'N/A'}</div>
            </div>
          </div>
          
          <div className="balance-content">
            <h2 className="balance-section-title">Current Account Balance</h2>
            <div className="balance-card-display">
              <div className="balance-label-text">Current Balance</div>
              <div className="balance-amount-display">
                {showBalance ? (
                  `₱${Number(userData.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  '₱•,•••.••'
                )}
                <button 
                  className="balance-toggle-btn" 
                  onClick={() => setShowBalance(!showBalance)}
                  title={showBalance ? "Hide balance" : "Show balance"}
                >
                  <img src={showBalance ? viewIcon : hideIcon} alt="Toggle" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show login form
  return (
    <div className="check-balance-root">
      <div className="check-balance-shell">
        <div className="check-balance-left">
          <img src={logo} alt="CacheFlow Logo" className="check-balance-logo" />
          <div className="check-balance-blurb">
            Quickly check your account balance without full login. Just enter your username and 4-digit PIN.
          </div>
        </div>

        <div className="check-balance-right">
          <div className="check-balance-panel">
            <h2 className="check-balance-title">Check Balance</h2>
            
            <form onSubmit={handleCheckBalance}>
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
                <label>PIN</label>
                <div className="input-wrap">
                  <input
                    type={showPin ? "text" : "password"}
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="input"
                    maxLength={4}
                  />
                  <span className="toggle" onClick={() => setShowPin(prev => !prev)} title={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? '👁️' : '🙈'}</span>
                </div>
              </div>

              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn-submit" disabled={lockUntil && Date.now() < lockUntil}>Check Balance</button>
            </form>
            
            <div className="back-to-login-cta">
              <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}>
                Back to Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckBalance;
