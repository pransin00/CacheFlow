import ServicesSection from "./ServicesSection";
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/CacheFlow_Logo.png";
import cardImg from "./assets/cards.png";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ width: "100%", background: "#dde6f7" }}>
      <section style={{ minHeight: "100vh", width: "100%" }}>
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
            <img src={logo} alt="CacheFlow Logo" style={{ height: 100, marginRight: 20 }} />
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <a href="#about" style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 18 }}>About</a>
            <a href="#contact" style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 18 }}>Contact Us</a>
            <button
              style={{
                marginLeft: 32,
                padding: "8px 24px",
                border: "2px solid #2196f3",
                background: "#e3f0ff",
                color: "#1976d2",
                cursor: "pointer",
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 16
              }}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </nav>
        <div style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 5%",
          width: "100%",
          height: "100%",
          boxSizing: "border-box"
        }}>
          {/* Left Section */}
          <div style={{ maxWidth: "48%", minWidth: 260, width: "100%", height: "100%" }}>
            <div style={{ color: "#1976d2", fontWeight: 600, fontSize: 20, marginBottom: 8 }}>Cache Flow</div>
            <div style={{ fontSize: "300%", fontWeight: 700, color: "#222", lineHeight: 1.1, marginBottom: "2%", minFontSize: 32 }}>
              Experience<br />hassle-free banking
            </div>
            <div style={{ color: "#4a5a6a", fontSize: "120%", marginBottom: "2%", minFontSize: 14 }}>
              Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow
            </div>
            <div style={{ display: "flex", gap: "2%", width: "100%" }}>
              <button style={{
                background: "#0a3cff",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "1% 2%",
                fontWeight: 600,
                fontSize: "120%",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(10,60,255,0.08)"
              }}>Get Started</button>
              <button style={{
                background: "#e3f0ff",
                color: "#1976d2",
                border: "2px solid #2196f3",
                borderRadius: 8,
                padding: "1% 2%",
                fontWeight: 600,
                fontSize: "120%",
                cursor: "pointer"
              }}>Learn More →</button>
            </div>
          </div>
          {/* Only the cards.png image, no container or underlay */}
          <img src={cardImg} alt="Card" style={{ width: "48%", minWidth: 260, height: "auto" }} />
        </div>
      </section>
      <ServicesSection />
    </div>
  );
};

export default LandingPage;
