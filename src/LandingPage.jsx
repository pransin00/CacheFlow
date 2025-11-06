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
            <a href="#services" style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 18 }}>Services</a>
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

      {/* diagonal/gradient divider between hero and features */}
      <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0 }} aria-hidden>
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 180 }}>
          <defs>
            <linearGradient id="heroToFeatures" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#dde6f7" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path d="M0,0 L1440,0 L1440,120 C960,60 480,180 0,120 Z" fill="url(#heroToFeatures)" />
        </svg>
      </div>

      <section id="services" style={{ scrollMarginTop: 0 }}>
        <ServicesSection />
      </section>

  <section id="about" style={{ padding: '6% 6%', background: '#f8fafc', minHeight: '70vh', display: 'flex', alignItems: 'center' , scrollMarginTop: 0 }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%' }}>
          <div style={{ background: '#ffffff', borderRadius: 14, boxShadow: '0 12px 40px rgba(2,6,23,0.08)', padding: 32, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 680px', minWidth: 320 }}>
              <h2 style={{ color: '#0f172a', fontSize: 34, margin: '4px 0 16px', fontWeight: 900 }}>About the Project</h2>
              <div style={{ color: '#374151', lineHeight: 1.8, fontSize: 16 }}>
                <p style={{ marginTop: 0 }}>
                  CacheFlow is a System Quality Assurance (SQA) semestral project that focuses on the development and testing of an online banking system. The project aims to evaluate the system’s functionality, reliability, usability, efficiency, and security based on software quality standards.
                </p>

                <p>
                  CacheFlow simulates real-world online banking processes such as account login, balance inquiry, fund management, and transaction validation, providing a safe environment to test and analyze how an online banking system performs under different conditions.
                </p>

                <p>
                  Through systematic testing and documentation, the project demonstrates the importance of quality assurance practices in software development—ensuring that the system meets user requirements and performs efficiently before deployment.
                </p>
              </div>
            </div>

            <aside style={{ width: 380, minWidth: 260, background: '#f1f5f9', borderRadius: 12, padding: 20, boxSizing: 'border-box' }}>
              <h3 style={{ marginTop: 0, marginBottom: 10, color: '#0f172a' }}>🎯 Project Objectives</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', lineHeight: 1.8 }}>
                <li>Design & implement a prototype online banking system.</li>
                <li>Perform functional, non-functional and usability testing.</li>
                <li>Document defects and recommend improvements.</li>
                <li>Ensure compliance with quality standards.</li>
              </ul>

              <div style={{ marginTop: 20, padding: 14, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.04)' }}>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 800 }}>Project Type</div>
                <div style={{ color: '#475569', marginTop: 6 }}>SQA Semester Project</div>

                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Focus Areas</div>
                <div style={{ color: '#475569', marginTop: 6 }}>Functionality • Reliability • Usability • Security</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="contact" style={{ height: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center' }}>
            <h2 style={{ color: '#333', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>Contact Us</h2>
            <p style={{ color: '#6b7280', marginBottom: 0, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>Get in touch or meet the team below.</p>
          </div>

          {/* Slideshow container moved to Contact section */}
          <TeamSlideshow />
        </div>
      </section>
    </div>
  );
};

const TeamSlideshow = () => {
  const team = [
    { name: 'John Smith', role: 'Company CEO', color: '#ffd5c2' },
    { name: 'David Johnson', role: 'Co-Founder', color: '#ffd0dd' },
    { name: 'Mary Johnson', role: 'Product Manager', color: '#dbeeff' },
    { name: 'Patricia Davis', role: 'Estate Consultant', color: '#ffe7d1' },
    { name: 'Alex Turner', role: 'Frontend Engineer', color: '#e6f7ff' },
    { name: 'Sophia Martinez', role: 'Backend Engineer', color: '#fbe7f0' }
  ];

  const CARD_WIDTH = 360; // px
  const GAP = 28; // px
  const visibleCount = 3;

  // build clone buffer for seamless loop
  const slides = [...team.slice(-visibleCount), ...team, ...team.slice(0, visibleCount)];
  const total = slides.length;

  const [cur, setCur] = React.useState(visibleCount); // start at first real slide
  const [isTransitioning, setIsTransitioning] = React.useState(true);
  const trackRef = React.useRef(null);

  // autoplay
  React.useEffect(() => {
    const iv = setInterval(() => setCur(c => c + 1), 4000);
    return () => clearInterval(iv);
  }, []);

  // handle transition end for seamless jump
  React.useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const onEnd = () => {
      // if we've moved past the real slides at end, jump back without transition
      if (cur >= team.length + visibleCount) {
        setIsTransitioning(false);
        setCur(visibleCount);
      }
      // if we've moved before real slides at start, jump to end window
      if (cur < visibleCount) {
        setIsTransitioning(false);
        setCur(team.length + (cur % team.length));
      }
    };
    node.addEventListener('transitionend', onEnd);
    return () => node.removeEventListener('transitionend', onEnd);
  }, [cur, team.length]);

  // re-enable transition after a non-transition move
  React.useEffect(() => {
    if (!isTransitioning) {
      // next tick re-enable
      const t = setTimeout(() => setIsTransitioning(true), 20);
      return () => clearTimeout(t);
    }
  }, [isTransitioning]);

  const prev = () => setCur(c => c - 1);
  const next = () => setCur(c => c + 1);

  const setIndex = (i) => {
    // set to corresponding real index offset by visibleCount
    setCur(i + visibleCount);
  };

  const trackWidth = slides.length * (CARD_WIDTH + GAP);
  const offset = cur * (CARD_WIDTH + GAP);

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={prev} aria-label="Previous" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.05)', border: 'none', width: 44, height: 44, borderRadius: 44, cursor: 'pointer' }}>❮</button>

      <div style={{ width: (CARD_WIDTH * visibleCount) + (GAP * (visibleCount - 1)), overflow: 'hidden' }}>
        <div ref={trackRef} style={{ display: 'flex', gap: GAP, transform: `translateX(-${offset}px)`, transition: isTransitioning ? 'transform 600ms ease' : 'none', width: trackWidth }}>
          {slides.map((m, idx) => (
            <div key={`${m.name}-${idx}`} style={{ width: CARD_WIDTH, flex: '0 0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(13,38,76,0.06)', overflow: 'visible' }}>
              <div style={{ height: 260, background: m.color, borderTopLeftRadius: 12, borderTopRightRadius: 12, position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: -60, height: 120, background: m.color, borderBottomLeftRadius: 200, borderBottomRightRadius: 200 }} />
                <div style={{ position: 'relative', zIndex: 2, width: 140, height: 140, borderRadius: 140, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: -70, marginTop: 16, boxShadow: '0 10px 30px rgba(10,60,255,0.08)' }}>
                  <div style={{ width: 128, height: 128, borderRadius: 128, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#333' }}>{m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                </div>
              </div>

              <div style={{ padding: '92px 18px 24px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: '#111', fontSize: 18 }}>{m.name}</div>
                <div style={{ color: '#6b7280', marginTop: 8 }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={next} aria-label="Next" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.05)', border: 'none', width: 44, height: 44, borderRadius: 44, cursor: 'pointer' }}>❯</button>

      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {team.map((_, i) => {
          const active = ((cur - visibleCount) % team.length + team.length) % team.length === i;
          return <div key={i} onClick={() => setIndex(i)} style={{ width: 10, height: 10, borderRadius: 10, background: active ? '#0a3cff' : '#e5e7eb', cursor: 'pointer' }} />
        })}
      </div>
    </div>
  );
};

export default LandingPage;
