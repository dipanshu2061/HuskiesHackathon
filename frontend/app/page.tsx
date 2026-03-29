"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [visible, setVisible] = useState(false);
  const token = localStorage.getItem("token")

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F8F7F4", fontFamily: "'DM Sans', sans-serif", color: "#111110" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');
        .fade-up { opacity:0; transform:translateY(18px); transition:opacity 0.7s ease,transform 0.7s ease; }
        .fade-up.in { opacity:1; transform:translateY(0); }
        .d1{transition-delay:.05s} .d2{transition-delay:.15s} .d3{transition-delay:.25s}
        .d4{transition-delay:.35s} .d5{transition-delay:.45s} .d6{transition-delay:.55s}
        .pill-btn { display:inline-flex; align-items:center; gap:8px; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.04em; padding:9px 20px; border-radius:100px; border:0.5px solid rgba(0,0,0,0.18); background:transparent; color:#111110; cursor:pointer; transition:background 0.15s,border-color 0.15s; text-decoration:none; }
        .pill-btn:hover { background:rgba(0,0,0,0.04); border-color:rgba(0,0,0,0.3); }
        .pill-btn.filled { background:#111110; color:#F8F7F4; border-color:#111110; }
        .pill-btn.filled:hover { background:#2a2a28; }
        .feature-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1px; background:rgba(0,0,0,0.08); border:0.5px solid rgba(0,0,0,0.08); border-radius:16px; overflow:hidden; }
        .feature-cell { background:#F8F7F4; padding:32px 28px; }
        .ticker { display:flex; gap:24px; font-family:'DM Mono',monospace; font-size:10px; color:rgba(0,0,0,0.3); letter-spacing:0.05em; align-items:center; }
        .ticker-dot { width:3px; height:3px; border-radius:50%; background:rgba(0,0,0,0.2); flex-shrink:0; }
      `}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-6" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px", letterSpacing: "-0.01em" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </div>
        <div className="flex items-center gap-3">
          {!token &&
            <>
            <Link href="/login" className="pill-btn">Sign in</Link>
            <Link href="/login" className="pill-btn filled">Get started</Link>
              </>
          }
          { token &&
            <Link href="/plaid" className="pill-btn filled">Link Your Account</Link>
          }
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className={`fade-up d1 ${visible ? "in" : ""} ticker`} style={{ justifyContent: "center", marginBottom: "40px" }}>
          <span>Plaid</span><div className="ticker-dot"/><span>Claude AI</span><div className="ticker-dot"/><span>Next.js</span>
        </div>

        <h1
          className={`fade-up d2 ${visible ? "in" : ""}`}
          style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(44px,7vw,86px)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "800px", marginBottom: "28px" }}
        >
          Your expenses,<br />
          <span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>organized instantly.</span>
        </h1>

        <p className={`fade-up d3 ${visible ? "in" : ""}`} style={{ fontSize: "15px", color: "rgba(0,0,0,0.45)", maxWidth: "420px", lineHeight: 1.75, fontWeight: 300, marginBottom: "40px" }}>
          Connect your bank. Claude reads every transaction and categorizes it. Export a clean CSV in one click.
        </p>

        <div className={`fade-up d4 ${visible ? "in" : ""} flex items-center gap-3`}>
          <Link href="/login" className="pill-btn filled">Connect your bank</Link>
          <a href="#how" className="pill-btn">How it works</a>
        </div>

        {/* Preview card */}
        <div className={`fade-up d5 ${visible ? "in" : ""}`} style={{ marginTop: "64px", width: "100%", maxWidth: "580px", background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "20px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "0.5px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "6px" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(0,0,0,0.07)" }} />)}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ width: "130px", height: "13px", borderRadius: "4px", background: "rgba(0,0,0,0.05)" }} />
            </div>
          </div>
          {[
            { name: "DELTA AIR LINES", date: "Mar 26", cat: "Travel", bg: "#dbeafe", tc: "#1e40af", amt: "-$412.00", pos: false },
            { name: "WHOLE FOODS MARKET", date: "Mar 25", cat: "Food & Dining", bg: "#fef3c7", tc: "#92400e", amt: "-$84.32", pos: false },
            { name: "PAYROLL DEPOSIT", date: "Mar 24", cat: "Income", bg: "#dcfce7", tc: "#166534", amt: "+$3,200.00", pos: true },
            { name: "AMAZON.COM", date: "Mar 23", cat: "Shopping", bg: "#ede9fe", tc: "#4c1d95", amt: "-$134.99", pos: false },
          ].map((tx, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none" }}>
              <div style={{ flex: 1, fontWeight: 500, fontSize: "11.5px", color: "#111110" }}>{tx.name}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>{tx.date}</div>
              <div style={{ fontSize: "10px", fontWeight: 500, padding: "3px 9px", borderRadius: "100px", background: tx.bg, color: tx.tc, whiteSpace: "nowrap" }}>{tx.cat}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "11.5px", color: tx.pos ? "#166534" : "#111110", minWidth: "68px", textAlign: "right" }}>{tx.amt}</div>
            </div>
          ))}
          <div style={{ padding: "11px 20px", background: "rgba(0,0,0,0.015)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>20 transactions · AI categorized</span>
            <div style={{ display: "flex", gap: "7px" }}>
              <div style={{ fontSize: "10px", padding: "4px 12px", borderRadius: "100px", border: "0.5px solid rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.45)", cursor: "pointer" }}>Copy CSV</div>
              <div style={{ fontSize: "10px", padding: "4px 12px", borderRadius: "100px", background: "#111110", color: "#fff", cursor: "pointer" }}>Export CSV</div>
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section id="how" style={{ padding: "64px 40px 80px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div className={`fade-up d6 ${visible ? "in" : ""}`}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "36px" }}>How it works</div>
          <div className="feature-row">
            {[
              { n: "01", title: "Connect", desc: "Link your bank via Plaid. Read-only, bank-level encryption. Your credentials are never stored." },
              { n: "02", title: "Categorize", desc: "Claude reads every merchant and assigns a category automatically — Food, Travel, Shopping, and more." },
              { n: "03", title: "Export", desc: "One click downloads a clean CSV ready for Excel, Google Sheets, or your accountant." },
            ].map((s) => (
              <div key={s.n} className="feature-cell">
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.25)", marginBottom: "20px", letterSpacing: "0.06em" }}>{s.n}</div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", fontWeight: 400, marginBottom: "10px", lineHeight: 1.15 }}>{s.title}</div>
                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.42)", lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "20px 40px", borderTop: "0.5px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "14px", color: "rgba(0,0,0,0.32)" }}>
          receipt<span style={{ fontStyle: "italic" }}>.it</span>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.22)", letterSpacing: "0.04em" }}>Huskies Hackathon 2026</div>
      </footer>
    </div>
  );
}

