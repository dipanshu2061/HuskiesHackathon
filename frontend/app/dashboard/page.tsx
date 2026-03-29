"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transaction {
  transaction_id: string;
  name: string;
  date: string;
  amount: number;
  personal_finance_category?: { primary: string };
  account_id: string;
}

interface PlaidResult {
  itemId: string;
  institutionName: string;
  transactions: Transaction[];
  accounts: { accountId: string; name: string; mask: string }[];
}

// ── Category mapping from Plaid's personal_finance_category to display labels ─
const PLAID_CAT_MAP: Record<string, string> = {
  FOOD_AND_DRINK: "Food & Dining",
  TRAVEL: "Travel",
  SHOPPING: "Shopping",
  ENTERTAINMENT: "Entertainment",
  MEDICAL: "Health",
  GENERAL_MERCHANDISE: "Shopping",
  HOME_IMPROVEMENT: "Home",
  PERSONAL_CARE: "Health",
  TRANSPORTATION: "Travel",
  INCOME: "Income",
  TRANSFER_IN: "Income",
  TRANSFER_OUT: "Shopping",
  LOAN_PAYMENTS: "Loans",
  RENT_AND_UTILITIES: "Utilities",
  GENERAL_SERVICES: "Services",
  GOVERNMENT_AND_NON_PROFIT: "Other",
  BANK_FEES: "Other",
};

function mapCategory(tx: Transaction): string {
  const raw = tx.personal_finance_category?.primary;
  if (!raw) return "Other";
  // Plaid amounts are positive for debits, negative for credits
  if (tx.amount < 0) return "Income";
  return PLAID_CAT_MAP[raw] || "Other";
}

const CAT_STYLES: Record<string, { bg: string; color: string }> = {
  "Food & Dining":  { bg: "#fef3c7", color: "#92400e" },
  "Travel":         { bg: "#dbeafe", color: "#1e40af" },
  "Shopping":       { bg: "#ede9fe", color: "#4c1d95" },
  "Entertainment":  { bg: "#fce7f3", color: "#9d174d" },
  "Health":         { bg: "#fee2e2", color: "#991b1b" },
  "Home":           { bg: "#e0f2fe", color: "#075985" },
  "Utilities":      { bg: "#fef9c3", color: "#713f12" },
  "Services":       { bg: "#f0fdf4", color: "#14532d" },
  "Loans":          { bg: "#fff7ed", color: "#7c2d12" },
  "Income":         { bg: "#d1fae5", color: "#065f46" },
  "Other":          { bg: "#f3f4f6", color: "#374151" },
};

function catStyle(cat: string) {
  return CAT_STYLES[cat] ?? CAT_STYLES["Other"];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

// Plaid: positive amount = money leaving account (debit), negative = credit
// Flip sign so the UI shows debits as negative and credits as positive
function displayAmount(tx: Transaction) {
  return -tx.amount;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [institutions, setInstitutions] = useState<PlaidResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "http://localhost:5000/api/plaid/transactions/get",{
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }

        const data: { results: PlaidResult[]; errors?: { itemId: string; error: string }[] } =
          await res.json();

        // Flatten all transactions across all institutions and tag each with institution name
        const allTx = data.results.flatMap((r) => r.transactions);
        // Sort newest first
        allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setInstitutions(data.results);
        setTransactions(allTx);

        if (data.errors?.length) {
          console.warn("Some institutions failed to load:", data.errors);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const enriched = transactions.map((tx) => ({
    ...tx,
    displayAmount: displayAmount(tx),
    category: mapCategory(tx),
  }));

  const filtered = enriched.filter((tx) => {
    const matchSearch = tx.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter ? tx.category === catFilter : true;
    return matchSearch && matchCat;
  });

  const spent  = enriched.filter((t) => t.displayAmount < 0).reduce((s, t) => s + Math.abs(t.displayAmount), 0);
  const income = enriched.filter((t) => t.displayAmount > 0).reduce((s, t) => s + t.displayAmount, 0);
  const net    = income - spent;

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ["Date", "Merchant", "Amount", "Type", "Category"],
      ...enriched.map((t) => [
        t.date, t.name,
        t.displayAmount.toFixed(2),
        t.displayAmount > 0 ? "Credit" : "Debit",
        t.category,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "receipt-it-export.csv";
    a.click();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .skeleton { background:rgba(0,0,0,0.06); border-radius:6px; animation:pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", background: "#F8F7F4" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Show all connected institutions */}
          {institutions.map((inst) => (
            <div key={inst.itemId} style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em" }}>
              {inst.institutionName} ••{inst.accounts[0]?.mask ?? "—"}
            </div>
          ))}
          <button className="pill-btn" onClick={exportCSV} disabled={loading}>Export CSV</button>
          <Link href="/report" className="pill-btn filled">View report</Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 32px" }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#fee2e2", border: "0.5px solid #fca5a5", borderRadius: "10px", padding: "12px 18px", marginBottom: "20px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "#991b1b" }}>
            Failed to load transactions: {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Transactions", value: loading ? null : enriched.length.toString() },
            { label: "Total spent",  value: loading ? null : fmt(spent) },
            { label: "Total income", value: loading ? null : fmt(income), green: true },
            { label: "Net",          value: loading ? null : (net >= 0 ? "+" : "") + fmt(Math.abs(net)), green: net >= 0 },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "8px" }}>{s.label}</div>
              {s.value === null
                ? <div className="skeleton" style={{ height: "28px", width: "70%" }} />
                : <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: 400, color: s.green ? "#065f46" : "#111110" }}>{s.value}</div>
              }
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
            <div style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>
              {loading ? "Loading…" : `${filtered.length} transactions`}
            </div>
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
            {["Merchant", "Date", "Category", "Amount"].map((h, i) => (
              <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", flex: i === 0 ? 1 : "none", width: i === 1 ? "72px" : i === 2 ? "140px" : "80px", textAlign: i === 3 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          {/* Loading skeletons */}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="tx-row">
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: "13px", width: `${50 + (i % 3) * 15}%` }} /></div>
              <div style={{ width: "72px" }}><div className="skeleton" style={{ height: "13px", width: "100%" }} /></div>
              <div style={{ width: "140px" }}><div className="skeleton" style={{ height: "20px", width: "80%", borderRadius: "100px" }} /></div>
              <div style={{ width: "80px", display: "flex", justifyContent: "flex-end" }}><div className="skeleton" style={{ height: "13px", width: "70%" }} /></div>
            </div>
          ))}

          {/* Rows */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center", color: "rgba(0,0,0,0.28)", fontFamily: "'DM Mono',monospace", fontSize: "11px" }}>
              {error ? "Could not load transactions." : "No transactions match your filters."}
            </div>
          )}

          {!loading && filtered.map((tx) => {
            const cs = catStyle(tx.category);
            return (
              <div key={tx.transaction_id} className="tx-row">
                <div style={{ flex: 1, fontWeight: 500, color: "#111110" }}>{tx.name}</div>
                <div style={{ width: "72px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(0,0,0,0.3)" }}>{tx.date.slice(5)}</div>
                <div style={{ width: "140px" }}>
                  <span className="chip" style={{ background: cs.bg, color: cs.color }}>{tx.category}</span>
                </div>
                <div style={{ width: "80px", fontFamily: "'DM Mono',monospace", fontSize: "12.5px", textAlign: "right", color: tx.displayAmount > 0 ? "#065f46" : "#111110" }}>
                  {tx.displayAmount > 0 ? "+" : ""}{fmt(Math.abs(tx.displayAmount))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
