import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import logo from "./assets/CacheFlow_Logo.png";

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
    // Store user id in localStorage for dashboard use
    localStorage.setItem('user_id', data.id);
    // Store contact_number or phone for OTP step
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
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#e6edfa",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><g opacity='0.13'><rect x='0' y='0' width='100%' height='100%' fill='none'/><g font-size='48' font-family='Arial' fill='%230a3cff'><text x='20' y='60'>💳</text><text x='120' y='160'>🏦</text><text x='220' y='100'>💰</text><text x='320' y='200'>📈</text><text x='420' y='80'>📄</text><text x='520' y='180'>💸</text><text x='620' y='120'>🧾</text><text x='720' y='220'>💵</text></g></g></svg>')`,
      backgroundRepeat: "repeat",
      backgroundSize: "auto"
    }}>
      <div style={{
        width: "80vw",
        maxWidth: 1100,
        minHeight: 500,
        background: "rgba(255,255,255,0.0)",
        borderRadius: 24,
        display: "flex",
        boxShadow: "none"
      }}>
        {/* Left Side */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          padding: "0 32px"
        }}>
          <img src={logo} alt="CacheFlow Logo" style={{ width: 220, marginBottom: 24, marginTop: -30 }} />
          <div style={{ color: "#222", fontSize: 17, textAlign: "center", maxWidth: 340, fontWeight: 400, lineHeight: 1.5 }}>
            Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
          </div>
        </div>
        {/* Right Side (Login Form) */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #fafdff 60%, #e6edfa 100%)",
            borderRadius: 20,
            boxShadow: "0 8px 40px rgba(10,60,255,0.13)",
            padding: "44px 38px 36px 38px",
            minWidth: 400,
            maxWidth: 440,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: 28, color: "#0a3cff", fontWeight: 700, fontSize: 28, letterSpacing: 0.2 }}>Login</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", marginBottom: 7, color: "#222", fontWeight: 600, fontSize: 15 }}>Username</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Enter your Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ width: "100%", padding: "13px 44px 13px 16px", borderRadius: 8, border: "1.5px solid #dbeafe", fontSize: 16, background: "#fafdff", fontWeight: 500, outline: "none" }}
                  />
                  <span style={{ position: "absolute", right: 14, top: 10, color: "#b3bfcf", fontSize: 20 }}>&#128100;</span>
                </div>
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", marginBottom: 7, color: "#222", fontWeight: 600, fontSize: 15 }}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "13px 44px 13px 16px", borderRadius: 8, border: "1.5px solid #dbeafe", fontSize: 16, background: "#fafdff", fontWeight: 500, outline: "none" }}
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ position: "absolute", right: 12, top: 12, cursor: "pointer", fontSize: 20 }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                  <a href="#" style={{ position: "absolute", right: 44, top: 10, color: "#1976d2", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>Forgot?</a>
                  <span style={{ position: "absolute", right: 14, top: 10, color: "#b3bfcf", fontSize: 20 }}>&#128065;</span>
                </div>
              </div>
              {error && <div style={{ color: "#e53935", marginBottom: 12, textAlign: "center" }}>{error}</div>}
              <button type="submit" style={{ width: "100%", background: "linear-gradient(90deg, #0a3cff 60%, #1976d2 100%)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700, fontSize: 18, cursor: "pointer", marginTop: 8, boxShadow: "0 2px 8px rgba(10,60,255,0.10)" }}>
                Login
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 18, color: "#888", fontSize: 15, fontWeight: 500 }}>
              Don’t Have an Account? <a href="#" style={{ color: "#0a3cff", fontWeight: 700, textDecoration: "none" }}>Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
