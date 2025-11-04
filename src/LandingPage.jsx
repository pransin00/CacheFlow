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

      <section id="about" style={{ padding: '6% 4%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#333', fontSize: 40, marginBottom: 8, fontWeight: 700 }}>Meet Our Team</h2>
          <p style={{ color: '#6b7280', marginBottom: 32, maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>Our dedicated team of experienced professionals is at the heart of what we do. We combine product focus, design, and engineering to build delightful banking experiences.</p>

          <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { name: 'John Smith', role: 'Company CEO', color: '#ffd5c2' },
              { name: 'David Johnson', role: 'Co-Founder', color: '#ffd0dd' },
              { name: 'Mary Johnson', role: 'Product Manager', color: '#dbeeff' },
              { name: 'Patricia Davis', role: 'Estate Consultant', color: '#ffe7d1' },
              { name: 'Alex Turner', role: 'Frontend Engineer', color: '#e6f7ff' },
              { name: 'Sophia Martinez', role: 'Backend Engineer', color: '#fbe7f0' }
            ].map((m) => (
              <div key={m.name} style={{ width: 180, background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(13,38,76,0.06)', overflow: 'visible' }}>
                <div style={{ height: 120, background: m.color, borderTopLeftRadius: 10, borderTopRightRadius: 10, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {/* curved bottom effect */}
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: -34, height: 68, background: m.color, borderBottomLeftRadius: 100, borderBottomRightRadius: 100 }} />
                  {/* avatar circle overlapping */}
                  <div style={{ position: 'relative', zIndex: 2, width: 100, height: 100, borderRadius: 100, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: -50, boxShadow: '0 6px 18px rgba(10,60,255,0.06)' }}>
                    <div style={{ width: 90, height: 90, borderRadius: 90, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#333' }}>
                      {m.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '60px 12px 16px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#111' }}>{m.name}</div>
                  <div style={{ color: '#6b7280', marginTop: 6, fontSize: 13 }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
