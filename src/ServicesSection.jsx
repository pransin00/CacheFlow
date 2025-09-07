import React from "react";
import piggyIcon from "./assets/piggy.png";
import withdrawIcon from "./assets/withdraw.png";
import transferIcon from "./assets/transfer.png";
import investIcon from "./assets/invest.png";
import billIcon from "./assets/bill.png";
import historyIcon from "./assets/history.png";

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
    icon: investIcon,
    title: "Investment services",
    desc: "Take your money further with CacheFlow’s investment services. Explore smart investment options, monitor your portfolio, track returns, and make informed decisions—all from one convenient platform, helping you grow your wealth safely and effectively.",
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

const ServicesSection = () => (
  <div style={{ width: "100%", background: "#f5f7fa", padding: "0", margin: 0 }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 0 0 0" }}>
      <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 40, marginBottom: 40, color: "#111" }}>Services</h1>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 32,
        justifyContent: "center"
      }}>
        {services.map((s, i) => (
          <div key={i} style={{
            background: "#b3e0ff",
            borderRadius: 24,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            width: 480,
            minHeight: 180,
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
            padding: 32,
            marginBottom: 0
          }}>
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
);

export default ServicesSection;
