import React from "react";
import logo from "./assets/CacheFlow_Logo.png";
import cardImg from "./assets/cards.png";

const LandingPage = () => {
  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#dde6f7",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "3% 4% 0 4%",
        background: "transparent",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="CacheFlow Logo" style={{ height: 60, marginRight: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#about" style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 18 }}>About</a>
          <a href="#contact" style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 18 }}>Contact Us</a>
          <button style={{
            marginLeft: 32,
            padding: "8px 24px",
            border: "2px solid #2196f3",
            background: "#e3f0ff",
            color: "#1976d2",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer"
          }}>Login</button>
        </div>
      </nav>
      {/* Main Content */}
      <div style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 5%",
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* Left Section */}
  <div style={{ maxWidth: "48%", minWidth: 260, width: "100%" }}>
          <div style={{ color: "#1976d2", fontWeight: 600, fontSize: 20, marginBottom: 8 }}>Cache Flow</div>
          <div style={{ fontSize: "3vw", fontWeight: 700, color: "#222", lineHeight: 1.1, marginBottom: "2vw", minFontSize: 32 }}>
            Experience<br />hassle-free banking
          </div>
          <div style={{ color: "#4a5a6a", fontSize: "1.2vw", marginBottom: "2vw", minFontSize: 14 }}>
            Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
          </div>
          <div style={{ display: "flex", gap: "2%" }}>
            <button style={{
              background: "#0a3cff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "1vw 2vw",
              fontWeight: 600,
              fontSize: "1.2vw",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(10,60,255,0.08)"
            }}>Get Started</button>
            <button style={{
              background: "#e3f0ff",
              color: "#1976d2",
              border: "2px solid #2196f3",
              borderRadius: 8,
              padding: "1vw 2vw",
              fontWeight: 600,
              fontSize: "1.2vw",
              cursor: "pointer"
            }}>Learn More →</button>
          </div>
        </div>
        {/* Right Section */}
        <div style={{ position: "relative", width: "48%", minWidth: 260, height: "32vw", maxHeight: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={cardImg} alt="Card 1" style={{ position: "absolute", top: "13%", left: "15%", width: "80%", zIndex: 1, borderRadius: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.10)", transform: "rotate(-8deg)" }} />
          <img src={cardImg} alt="Card 2" style={{ position: "absolute", top: 0, left: 0, width: "80%", zIndex: 2, borderRadius: 20, boxShadow: "0 16px 40px rgba(0,0,0,0.18)", transform: "rotate(8deg)" }} />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
