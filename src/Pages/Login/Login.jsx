import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import logo from "../../assets/CacheFlow_Logo.png";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) {
      setError("Invalid username or password");
      return;
    }
    localStorage.setItem('user_id', data.id);
    if (data.contact_number) {
      localStorage.setItem('user_phone', data.contact_number);
      navigate('/otp-login');
    } else if (data.phone) {
      localStorage.setItem('user_phone', data.phone);
      navigate('/otp-login');
    } else {
      setError('No contact number found for user.');
      return;
    }
  }

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
              <button type="submit" className="btn-submit">Login</button>
            </form>
            <div className="register-cta">
              Don’t Have an Account? <a href="#">Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
