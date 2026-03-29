/*
"use client"
import NavBar from "@/components/NavBar"
export default function page() {
  return (
    <div
      style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans',sans-serif", color: "#111110", display: "flex", flexDirection: "column" }}
    >
      <NavBar />
    </div>
  )
}

*/

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TRANSACTIONS = [
  { id: 1,  name: "WHOLE FOODS MARKET",    date: "2026-03-27", amount: -84.32,  category: "Food & Dining" },
  { id: 2,  name: "DELTA AIR LINES",       date: "2026-03-26", amount: -412.00, category: "Travel" },
  { id: 3,  name: "NETFLIX.COM",           date: "2026-03-25", amount: -15.49,  category: "Entertainment" },
  { id: 4,  name: "PAYROLL DEPOSIT",       date: "2026-03-24", amount: 3200.00, category: "Income" },
  { id: 5,  name: "STARBUCKS #04821",      date: "2026-03-24", amount: -7.85,   category: "Food & Dining" },
  { id: 6,  name: "AMAZON.COM",            date: "2026-03-23", amount: -134.99, category: "Shopping" },
  { id: 7,  name: "WALGREENS PHARMACY",    date: "2026-03-23", amount: -23.41,  category: "Health" },
  { id: 8,  name: "UBER TRIP",             date: "2026-03-22", amount: -18.70,  category: "Travel" },
  { id: 9,  name: "CHIPOTLE MEXICAN GRILL",date: "2026-03-22", amount: -13.25,  category: "Food & Dining" },
  { id: 10, name: "STAPLES #0821",         date: "2026-03-21", amount: -46.80,  category: "Office Supplies" },
  { id: 11, name: "SPOTIFY USA",           date: "2026-03-20", amount: -9.99,   category: "Entertainment" },
  { id: 12, name: "TARGET STORES",         date: "2026-03-20", amount: -67.44,  category: "Shopping" },
  { id: 13, name: "HILTON HOTELS",         date: "2026-03-19", amount: -289.00, category: "Travel" },
  { id: 14, name: "TRADER JOES #142",      date: "2026-03-18", amount: -55.20,  category: "Food & Dining" },
  { id: 15, name: "APPLE.COM/BILL",        date: "2026-03-17", amount: -2.99,   category: "Entertainment" },
  { id: 16, name: "CVS PHARMACY",          date: "2026-03-16", amount: -31.60,  category: "Health" },
  { id: 17, name: "SOUTHWEST AIRLINES",    date: "2026-03-15", amount: -198.00, category: "Travel" },
  { id: 18, name: "MCDONALDS #8821",       date: "2026-03-15", amount: -9.47,   category: "Food & Dining" },
  { id: 19, name: "OFFICE DEPOT",          date: "2026-03-14", amount: -88.00,  category: "Office Supplies" },
  { id: 20, name: "FREELANCE PAYMENT",     date: "2026-03-13", amount: 850.00,  category: "Income" },
];

const CAT_STYLES: Record<string, { bg: string; color: string }> = {
  "Food & Dining":   { bg: "#fef3c7", color: "#92400e" },
  "Travel":          { bg: "#dbeafe", color: "#1e40af" },
  "Shopping":        { bg: "#ede9fe", color: "#4c1d95" },
  "Entertainment":   { bg: "#fce7f3", color: "#9d174d" },
  "Health":          { bg: "#fee2e2", color: "#991b1b" },
  "Office Supplies": { bg: "#dcfce7", color: "#166534" },
  "Income":          { bg: "#d1fae5", color: "#065f46" },
  "Other":           { bg: "#f3f4f6", color: "#374151" },
};

function catStyle(cat: string) {
  return CAT_STYLES[cat] || CAT_STYLES["Other"];
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [transactions, setTransactions] = useState("")

  useEffect(() => {
  })

  const filtered = TRANSACTIONS.filter((tx) => {
    const matchSearch = tx.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter ? tx.category === catFilter : true;
    return matchSearch && matchCat;
  });

  const spent = TRANSACTIONS.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const income = TRANSACTIONS.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const net = income - spent;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  const exportCSV = () => {
    const rows = [
      ["Date", "Merchant", "Amount", "Type", "Category"],
      ...TRANSACTIONS.map((t) => [
        t.date, t.name,
        t.amount.toFixed(2),
        t.amount > 0 ? "Credit" : "Debit",
        t.category,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "receipt-it-export.csv";
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans', sans-serif", color: "#111110" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');
        .pill-btn { display:inline-flex; align-items:center; gap:6px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.04em; padding:8px 16px; border-radius:100px; border:0.5px solid rgba(0,0,0,0.16); background:transparent; color:#111110; cursor:pointer; text-decoration:none; transition:background 0.12s; }
        .pill-btn:hover { background:rgba(0,0,0,0.04); }
        .pill-btn.filled { background:#111110; color:#F8F7F4; border-color:#111110; }
        .pill-btn.filled:hover { background:#2a2a28; }
        .stat-card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:14px; padding:20px 22px; }
        .tx-row { display:flex; align-items:center; gap:14px; padding:12px 20px; border-bottom:0.5px solid rgba(0,0,0,0.05); font-size:12.5px; transition:background 0.1s; }
        .tx-row:last-child { border-bottom:none; }
        .tx-row:hover { background:rgba(0,0,0,0.015); }
        .inp { background:#fff; border:0.5px solid rgba(0,0,0,0.12); border-radius:100px; padding:8px 16px; font-size:12px; font-family:'DM Sans',sans-serif; color:#111110; outline:none; transition:border-color 0.15s; }
        .inp:focus { border-color:rgba(0,0,0,0.35); }
        .inp::placeholder { color:rgba(0,0,0,0.28); }
        select.inp { cursor:pointer; appearance:none; padding-right:28px; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
        .chip { display:inline-block; font-size:10px; font-weight:500; padding:3px 10px; border-radius:100px; white-space:nowrap; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", background: "#F8F7F4" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em" }}>Chase Checking ••4821</div>
          <button className="pill-btn" onClick={exportCSV}>Export CSV</button>
          <Link href="/report" className="pill-btn filled">View report</Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Transactions", value: TRANSACTIONS.length.toString() },
            { label: "Total spent", value: fmt(spent) },
            { label: "Total income", value: fmt(income), green: true },
            { label: "Net", value: (net >= 0 ? "+" : "") + fmt(Math.abs(net)), green: net >= 0 },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "8px" }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: 400, color: s.green ? "#065f46" : "#111110" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: "16px", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
            <input className="inp" type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "220px" }} />
            <select className="inp" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: "180px" }}>
              <option value="">All categories</option>
              {Object.keys(CAT_STYLES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>{filtered.length} transactions</div>
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
            {["Merchant", "Date", "Category", "Amount"].map((h, i) => (
              <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", flex: i === 0 ? 1 : "none", width: i === 1 ? "72px" : i === 2 ? "140px" : "80px", textAlign: i === 3 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "rgba(0,0,0,0.28)", fontFamily: "'DM Mono',monospace", fontSize: "11px" }}>No transactions match your filters.</div>
          ) : (
            filtered.map((tx) => {
              const cs = catStyle(tx.category);
              return (
                <div key={tx.id} className="tx-row">
                  <div style={{ flex: 1, fontWeight: 500, color: "#111110" }}>{tx.name}</div>
                  <div style={{ width: "72px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(0,0,0,0.3)" }}>{tx.date.slice(5)}</div>
                  <div style={{ width: "140px" }}>
                    <span className="chip" style={{ background: cs.bg, color: cs.color }}>{tx.category}</span>
                  </div>
                  <div style={{ width: "80px", fontFamily: "'DM Mono',monospace", fontSize: "12.5px", textAlign: "right", color: tx.amount > 0 ? "#065f46" : "#111110" }}>
                    {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

