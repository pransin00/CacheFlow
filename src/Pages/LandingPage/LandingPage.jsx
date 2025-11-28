import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/CacheFlow_Logo.png";
import cardImg from "../../assets/cards.png";
import piggyIcon from "../../assets/piggy.png";
import withdrawIcon from "../../assets/withdraw.png";
import transferIcon from "../../assets/transfer.png";
import investIcon from "../../assets/invest.png";
import billIcon from "../../assets/bill.png";
import historyIcon from "../../assets/history.png";
import "./LandingPage.css";
import francineImg from "../../assets/profile/francine.png";
import piereImg from "../../assets/profile/piere.jpg";
import ianImg from "../../assets/profile/ian.jpg";
import jdImg from "../../assets/profile/jd.jpg";
import matthewImg from "../../assets/profile/matthew.jpg";
import djImg from "../../assets/profile/dj.jpg";

const services = [
  {
    icon: piggyIcon,
    title: "Check Balance",
    desc: "Stay in control of your finances anytime, anywhere. With CacheFlow, you can instantly view your account balances across all your accounts, giving you a clear snapshot of your available funds and helping you make smarter financial decisions.",
    color: "#0a3cff"
  },
  {
    icon: withdrawIcon,
    title: "Withdrawal",
    desc: "Access your money safely and conveniently whenever you need it. CacheFlow allows you to perform withdrawals quickly, with secure confirmation for every transaction, so you always know your funds are where you need them.",
    color: "#e53935"
  },
  {
    icon: transferIcon,
    title: "Transfer funds",
    desc: "Move money effortlessly between your own accounts or to other people. CacheFlow ensures fast, secure transfers with instant confirmation, giving you peace of mind and convenience for all your transactions.",
    color: "#e53935"
  },
  {
    icon: billIcon,
    title: "Payment / Pay Bills:",
    desc: "Simplify your life by paying bills directly through CacheFlow. From utilities to subscriptions, you can handle recurring payments securely and instantly, saving time and avoiding long lines or late fees.",
    color: "#0a3cff"
  },
  {
    icon: historyIcon,
    title: "Transaction History",
    desc: "Keep complete records of all your financial activity. CacheFlow provides a detailed, easy-to-read history of deposits, withdrawals, payments, and transfers. Filter, search, and download your transactions anytime for effortless tracking and auditing.",
    color: "#e53935"
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-root">
      <section className="landing-hero">
        {/* Navbar */}
        <nav className="landing-nav">
          <div className="landing-nav-left">
            <img src={logo} alt="CacheFlow Logo" className="landing-logo" />
          </div>
          <div className="landing-nav-right">
            <a href="#about" className="nav-link">About</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#contact" className="nav-link">Contact Us</a>
            <button className="btn-outline" onClick={() => navigate("/login")}>Login</button>
          </div>
        </nav>

        <div className="hero-inner">
          <div className="hero-left">
            <div className="brand">Cache Flow</div>
            <div className="hero-title">
              Experience<br />hassle-free banking
            </div>
            <div className="hero-sub">Experience simple, secure, and stress-free banking. Say goodbye to long queues and complex procedures and hello to hassle-free banking with CacheFlow</div>
          </div>

          <img src={cardImg} alt="Card" className="hero-image" />
        </div>
      </section>

      <div className="divider" aria-hidden>
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="divider-svg">
          <defs>
            <linearGradient id="heroToFeatures" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#dde6f7" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path d="M0,0 L1440,0 L1440,120 C960,60 480,180 0,120 Z" fill="url(#heroToFeatures)" />
        </svg>
      </div>

      <section id="services" className="services-section">
        <div style={{ width: "100%", background: "#f5f7fa", padding: "0", margin: 0 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 0 0 0" }}>
            <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 40, marginBottom: 40, color: "#111" }}>Services</h1>
            <div className="services-cards-row">
              {services.map((s, i) => (
                <div key={i} className="service-card">
                  <img src={s.icon} alt="icon" style={{ width: 48, height: 48, marginTop: 4 }} />
                  <div>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 24, marginBottom: 8 }}>{s.title}</div>
                    <div style={{ color: "#222", fontSize: 16, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-wrapper">
          <div className="about-card">
            <div className="about-main compact-about">
              <h2>About the Project</h2>
              <div className="about-text">
                <p>
                  CacheFlow is a System Quality Assurance (SQA) semestral project focused on building and testing an online banking system. The project evaluates functionality, reliability, usability, efficiency, and security.
                </p>
              </div>
            </div>

            <aside className="about-aside compact-about-aside">
              <h3>🎯 Project Objectives</h3>
              <ul>
                <li>Design & implement a prototype online banking system.</li>
                <li>Test for functionality, usability, and security.</li>
                <li>Document defects and recommend improvements.</li>
                <li>Ensure compliance with quality standards.</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-inner">
          <div className="contact-heading">
            <h2>Contact Us</h2>
            <p>Get in touch or meet the team below.</p>
          </div>

          <TeamSlideshow />
        </div>
      </section>
    </div>
  );
};

const TeamSlideshow = () => {
  const team = [
    { name: 'Francine Yzabel L. Jonson', role: 'Team Lead', img: francineImg, color: '#ffd5c2' },
    { name: 'Piere Paolo B. Bilugan', role: 'Business Analyst', img: piereImg, color: '#ffd0dd' },
    { name: 'Ian Vince A. Romero', role: 'Main Developer', img: ianImg, color: '#dbeeff' },
    { name: 'John Dave Botonnes', role: 'Lead QA', img: jdImg, color: '#ffe7d1' },
    { name: 'Matthew Alen Pereyra', role: 'Developer', img: matthewImg, color: '#e6f7ff' },
    { name: 'Dane Joshia Dimafelix', role: 'QA', img: djImg, color: '#fbe7f0' }
  ];

  // Responsive: 2 per slide for phone view
  const CARD_WIDTH = 180; // px for phone
  const GAP = 12; // px for phone
  const visibleCount = window.innerWidth <= 640 ? 2 : 3;

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
      if (cur >= team.length + visibleCount) {
        setIsTransitioning(false);
        setCur(visibleCount);
      }
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
      const t = setTimeout(() => setIsTransitioning(true), 20);
      return () => clearTimeout(t);
    }
  }, [isTransitioning]);

  const prev = () => setCur(c => c - 1);
  const next = () => setCur(c => c + 1);

  const setIndex = (i) => {
    setCur(i + visibleCount);
  };

  const trackWidth = slides.length * (CARD_WIDTH + GAP);
  const offset = cur * (CARD_WIDTH + GAP);

  return (
    <div className="slideshow-root">
      <button onClick={prev} aria-label="Previous" className="slide-btn prev">❮</button>

      <div className="viewport" style={{ width: (CARD_WIDTH * visibleCount) + (GAP * (visibleCount - 1)), overflow: 'hidden' }}>
        <div ref={trackRef} className="track" style={{ display: 'flex', gap: GAP, transform: `translateX(-${offset}px)`, transition: isTransitioning ? 'transform 600ms ease' : 'none', width: trackWidth }}>
          {slides.map((m, idx) => (
            <div key={`${m.name}-${idx}`} className="slide-card" style={{ width: CARD_WIDTH }}>
              <div className="slide-top" style={{ height: 260, background: m.color }}>
                <div className="slide-top-deco" />
                <div className="avatar">
                  {m.img ? (
                    <img src={m.img} alt={m.name} className="avatar-img" />
                  ) : (
                    m.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                  )}
                </div>
              </div>

              <div className="slide-body">
                <div className="slide-name">{m.name}</div>
                <div className="slide-role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={next} aria-label="Next" className="slide-btn next">❯</button>

      <div className="dots">
        {team.map((_, i) => {
          const active = ((cur - visibleCount) % team.length + team.length) % team.length === i;
          return <div key={i} onClick={() => setIndex(i)} className={"dot" + (active ? ' active' : '')} />
        })}
      </div>
    </div>
  );
};

export default LandingPage;
