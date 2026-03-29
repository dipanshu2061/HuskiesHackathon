"use client"

import Link from "next/link"

export default function NavBar() {
  return (
    
    <>
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

      <nav style={{ padding: "24px 40px", borderBottom: "0.5px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
      </nav>
  </>
  )
}

