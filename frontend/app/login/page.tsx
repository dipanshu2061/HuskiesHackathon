"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "next/font/google";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      //TODO make generic endpoint
      const endpoint =
        mode === "signin"
          ? "http://localhost:5000/api/auth/login"
          : "http://localhost:5000/api/auth/register";

      const body =
        mode === "signin"
          ? { email, password }
          : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Persist token
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);

      window.location.href = "/";
    } catch (err) {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans',sans-serif", color: "#111110", display: "flex", flexDirection: "column" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');
        .fade-up { opacity:0; transform:translateY(14px); transition:opacity 0.6s ease,transform 0.6s ease; }
        .fade-up.in { opacity:1; transform:translateY(0); }
        .d1{transition-delay:.05s} .d2{transition-delay:.12s} .d3{transition-delay:.2s}
        .login-input {
          width:100%; background:#fff; border:0.5px solid rgba(0,0,0,0.14); border-radius:10px;
          padding:11px 14px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#111110;
          outline:none; transition:border-color 0.15s; box-sizing:border-box;
        }
        .login-input:focus { border-color:rgba(0,0,0,0.4); }
        .login-input::placeholder { color:rgba(0,0,0,0.25); }
        .login-btn {
          width:100%; background:#111110; color:#F8F7F4; border:none; border-radius:100px;
          padding:12px; font-size:13px; font-weight:500; font-family:'DM Sans',sans-serif;
          cursor:pointer; transition:opacity 0.15s; letter-spacing:0.01em;
        }
        .login-btn:hover { opacity:0.85; }
        .login-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .google-btn {
          width:100%; background:#fff; color:#111110; border:0.5px solid rgba(0,0,0,0.12);
          border-radius:100px; padding:11px; font-size:13px; font-family:'DM Sans',sans-serif;
          cursor:pointer; transition:background 0.15s; display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .google-btn:hover { background:rgba(0,0,0,0.02); }
        .tab-btn {
          flex:1; padding:9px; text-align:center; font-size:12px; font-family:'DM Mono',monospace;
          letter-spacing:0.03em; border-radius:100px; cursor:pointer; border:none;
          background:transparent; color:rgba(0,0,0,0.35); transition:all 0.15s;
        }
        .tab-btn.active { background:#111110; color:#F8F7F4; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { width:14px; height:14px; border:1.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: "24px 40px", borderBottom: "0.5px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* Heading */}
          <div className={`fade-up d1 ${visible ? "in" : ""}`} style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "32px", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "8px" }}>
              {mode === "signin" ? "Welcome back." : "Get started."}
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", fontWeight: 300, lineHeight: 1.6 }}>
              {mode === "signin" ? "Sign in to your receipt.it account." : "Create your account — it's free."}
            </p>
          </div>

          {/* Tab toggle */}
          <div className={`fade-up d2 ${visible ? "in" : ""}`} style={{ display: "flex", background: "rgba(0,0,0,0.05)", borderRadius: "100px", padding: "3px", marginBottom: "24px" }}>
            <button className={`tab-btn ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>Sign in</button>
            <button className={`tab-btn ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Create account</button>
          </div>

          {/* Form */}
          <div className={`fade-up d3 ${visible ? "in" : ""}`}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {mode === "signup" && (
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: "6px" }}>Full name</label>
                  <input className="login-input" type="text" required placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: "6px" }}>Email</label>
                <input className="login-input" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)" }}>Password</label>
                  {mode === "signin" && (
                    <button type="button" style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Forgot?</button>
                  )}
                </div>
                <input className="login-input" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              
              {error && (
                <div style={{
                  background: "rgba(220,38,38,0.06)",
                  border: "0.5px solid rgba(220,38,38,0.18)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "12px",
                  color: "rgba(180,20,20,0.85)",
                  fontFamily: "'DM Sans',sans-serif",
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginTop: "4px" }}>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.08)" }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}></span>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.08)" }} />
            </div>

            <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(0,0,0,0.28)", marginTop: "20px", lineHeight: 1.6, fontWeight: 300 }}>
              By continuing you agree to our{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span>{" "}and{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

