"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────
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

interface NormalizedTx extends Transaction {
  displayAmount: number;
  category: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
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
  BANK_FEES: "Fees",
};

const CAT_STYLES: Record<string, { bg: string; color: string; bar: string }> = {
  "Food & Dining": { bg: "#fef3c7", color: "#92400e", bar: "#f59e0b" },
  Travel:          { bg: "#dbeafe", color: "#1e40af", bar: "#3b82f6" },
  Shopping:        { bg: "#ede9fe", color: "#4c1d95", bar: "#8b5cf6" },
  Entertainment:   { bg: "#fce7f3", color: "#9d174d", bar: "#ec4899" },
  Health:          { bg: "#fee2e2", color: "#991b1b", bar: "#ef4444" },
  Home:            { bg: "#e0f2fe", color: "#075985", bar: "#0ea5e9" },
  Utilities:       { bg: "#fef9c3", color: "#713f12", bar: "#eab308" },
  Services:        { bg: "#f0fdf4", color: "#14532d", bar: "#22c55e" },
  Loans:           { bg: "#fff7ed", color: "#7c2d12", bar: "#f97316" },
  Fees:            { bg: "#f1f5f9", color: "#334155", bar: "#64748b" },
  Income:          { bg: "#d1fae5", color: "#065f46", bar: "#10b981" },
  Other:           { bg: "#f3f4f6", color: "#374151", bar: "#9ca3af" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function mapCategory(tx: Transaction): string {
  if (tx.amount < 0) return "Income";
  const raw = tx.personal_finance_category?.primary;
  return raw ? PLAID_CAT_MAP[raw] ?? "Other" : "Other";
}

function getCatStyle(cat: string) {
  return CAT_STYLES[cat] ?? CAT_STYLES["Other"];
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = "14px", radius = "4px" }: { w?: string; h?: string; radius?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "rgba(255,255,255,0.06)",
      animation: "skpulse 1.4s ease-in-out infinite",
    }} />
  );
}

// ─── AI Insight Panel ──────────────────────────────────────────────────────────
function AIInsightPanel({ transactions, income, spent, net }: {
  transactions: NormalizedTx[];
  income: number;
  spent: number;
  net: number;
}) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const run = async () => {
    if (hasRun.current) return;
    hasRun.current = true;
    setLoading(true);
    setInsight("");
    setError(null);
    setDone(false);

    try {
      const auth = `Bearer ${localStorage.getItem("token")}`
      const url = "http://localhost:5000/api/ai/analyze"
      console.log(auth);
      const res = await fetch(url,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": auth
        },
        body: JSON.stringify({transactions, income, spent, net})
      })
      console.log("res::::::::", res)
      /*
      const res = await fetch("http://localhost:5000/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ transactions, income, spent, net }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const evt = JSON.parse(json);
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              setInsight((prev) => prev + evt.delta.text);
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
      setDone(true);
      */
    } catch (e: any) {
      setError(e.message);
      hasRun.current = false;
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    hasRun.current = false;
    setDone(false);
    setInsight("");
    run();
  };

  useEffect(() => {
    if (transactions.length > 0) run();
  }, [transactions.length]);

  const showSkeleton = loading && !insight;
  const showDots = loading && !!insight;

  return (
    <div style={{
      background: "#0d0d0c",
      border: "0.5px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      padding: "28px 30px",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* top glow line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)",
      }} />

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "rgba(16,185,129,0.12)",
          border: "0.5px solid rgba(16,185,129,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", color: "#10b981",
        }}>✦</div>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>
            AI Analysis
          </div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "14px", color: "rgba(255,255,255,0.88)" }}>
            Claude Financial Insights
          </div>
        </div>
        {showDots && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "4px", alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: "4px", height: "4px", borderRadius: "50%", background: "#10b981",
                animation: `aidot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* error */}
      {error && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "#f87171" }}>
          Failed to generate: {error}
          <button onClick={regenerate} style={{ marginLeft: "12px", background: "none", border: "none", color: "#f87171", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", fontSize: "inherit" }}>
            Retry
          </button>
        </div>
      )}

      {/* skeleton */}
      {showSkeleton && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[88, 72, 94, 65, 80].map((w, i) => (
            <Skeleton key={i} w={`${w}%`} h="12px" />
          ))}
        </div>
      )}

      {/* streamed text */}
      {insight && (
        <div style={{ fontSize: "13.5px", lineHeight: 1.78, color: "rgba(255,255,255,0.7)", fontWeight: 300, letterSpacing: "0.01em" }}>
          {insight.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} style={{ margin: 0, marginBottom: i < insight.split("\n\n").filter(Boolean).length - 1 ? "14px" : 0 }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {/* regenerate */}
      {done && (
        <button onClick={regenerate} style={{
          marginTop: "20px", fontFamily: "'DM Mono',monospace", fontSize: "9.5px",
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)", background: "transparent",
          border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >
          ↺ Regenerate
        </button>
      )}
    </div>
  );
}

// ─── Spending Heatmap ──────────────────────────────────────────────────────────
function SpendingHeatmap({ transactions }: { transactions: NormalizedTx[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay = days.map((_, d) =>
    transactions
      .filter((t) => t.displayAmount < 0 && new Date(t.date).getDay() === d)
      .reduce((s, t) => s + Math.abs(t.displayAmount), 0)
  );
  const max = Math.max(...byDay, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
      {days.map((day, i) => (
        <div key={day} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(0,0,0,0.3)", width: "28px" }}>{day}</div>
          <div style={{ flex: 1, height: "5px", background: "rgba(0,0,0,0.06)", borderRadius: "100px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "100px",
              width: `${(byDay[i] / max) * 100}%`,
              background: `rgba(139,92,246,${0.2 + (byDay[i] / max) * 0.7})`,
              transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(0,0,0,0.35)", width: "58px", textAlign: "right" }}>
            {byDay[i] > 0 ? fmt(byDay[i]) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CSV + PDF export ──────────────────────────────────────────────────────────
function exportCSV(transactions: NormalizedTx[]) {
  const rows = [
    ["Date", "Merchant", "Amount", "Type", "Category"],
    ...transactions.map((t) => [
      t.date,
      t.name,
      t.displayAmount.toFixed(2),
      t.displayAmount > 0 ? "Credit" : "Debit",
      t.category,
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "receipt-it-report.csv";
  a.click();
}

function downloadPDF(
  transactions: NormalizedTx[],
  income: number,
  spent: number,
  net: number,
  institution: string
) {
  const catTotals = Object.entries(
    transactions.filter((t) => t.displayAmount < 0).reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.displayAmount);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Financial Report · receipt.it</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Helvetica Neue',sans-serif;color:#111;background:#fff;padding:48px;font-size:12px}
  .logo{font-size:22px;font-weight:300;letter-spacing:-0.5px;margin-bottom:6px}
  .meta{color:#6b7280;font-size:10px;letter-spacing:.05em;text-transform:uppercase;padding-bottom:20px;border-bottom:1px solid #e5e7eb;margin-bottom:28px}
  h2{font-size:28px;font-weight:300;margin-bottom:6px}
  .sub{color:#6b7280;font-size:11px;margin-bottom:28px}
  .stats{display:flex;gap:16px;margin-bottom:32px}
  .stat{flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px}
  .stat-label{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px}
  .stat-value{font-size:20px;font-variant-numeric:tabular-nums}
  .section-label{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px}
  .cat-row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:.5px solid #f3f4f6}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#9ca3af;text-align:left;padding:8px 0;border-bottom:.5px solid #e5e7eb}
  td{padding:9px 0;border-bottom:.5px solid #f9fafb;font-size:11px}
  td:last-child{text-align:right;font-variant-numeric:tabular-nums}
  .green{color:#065f46}
  footer{margin-top:40px;padding-top:20px;border-top:.5px solid #e5e7eb;font-size:9px;color:#9ca3af;text-align:center;letter-spacing:.04em}
</style></head><body>
<div class="logo">receipt<em>.it</em></div>
<div class="meta">${institution} · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
<h2>Expense Report</h2>
<div class="sub">${transactions.length} transactions · AI categorized by Claude</div>
<div class="stats">
  <div class="stat"><div class="stat-label">Total Spent</div><div class="stat-value">${fmt(spent)}</div></div>
  <div class="stat"><div class="stat-label">Total Income</div><div class="stat-value green">${fmt(income)}</div></div>
  <div class="stat"><div class="stat-label">Net</div><div class="stat-value ${net >= 0 ? "green" : ""}">${net >= 0 ? "+" : ""}${fmt(Math.abs(net))}</div></div>
</div>
<div style="margin-bottom:32px">
  <div class="section-label">Spending by Category</div>
  ${catTotals.filter(([c]) => c !== "Income").map(([cat, total]) => `
    <div class="cat-row">
      <div style="flex:1;font-size:11px">${cat}</div>
      <div style="font-size:9px;color:#9ca3af;width:28px">${Math.round((total / spent) * 100)}%</div>
      <div style="font-size:11px;font-variant-numeric:tabular-nums">${fmt(total)}</div>
    </div>`).join("")}
</div>
<div class="section-label">All Transactions</div>
<table>
  <thead><tr><th>Merchant</th><th>Date</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${transactions.map((t) => `
      <tr>
        <td>${t.name}</td>
        <td style="color:#9ca3af">${t.date.slice(5)}</td>
        <td style="color:#6b7280">${t.category}</td>
        <td style="${t.displayAmount > 0 ? "color:#065f46" : ""}">${t.displayAmount > 0 ? "+" : ""}${fmt(Math.abs(t.displayAmount))}</td>
      </tr>`).join("")}
  </tbody>
</table>
<footer>receipt.it · Powered by Claude AI · ${new Date().toISOString().split("T")[0]}</footer>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [transactions, setTransactions] = useState<NormalizedTx[]>([]);
  const [institutions, setInstitutions] = useState<PlaidResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/plaid/transactions/get", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data: { results: PlaidResult[] } = await res.json();

        const allTx = data.results.flatMap((r) => r.transactions);
        allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setInstitutions(data.results);
        setTransactions(
          allTx.map((tx) => ({
            ...tx,
            displayAmount: -tx.amount,
            category: mapCategory(tx),
          }))
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const expenses  = transactions.filter((t) => t.displayAmount < 0);
  const deposits  = transactions.filter((t) => t.displayAmount > 0);
  const spent     = expenses.reduce((s, t) => s + Math.abs(t.displayAmount), 0);
  const income    = deposits.reduce((s, t) => s + t.displayAmount, 0);
  const net       = income - spent;

  const catTotals = Object.entries(
    expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.displayAmount);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topCat   = catTotals[0];
  const avgTx    = expenses.length > 0 ? spent / expenses.length : 0;

  const mostActiveDay = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay = new Array(7).fill(0);
    expenses.forEach((t) => (byDay[new Date(t.date).getDay()] += Math.abs(t.displayAmount)));
    return days[byDay.indexOf(Math.max(...byDay))] ?? "—";
  })();

  const topMerchants = Object.entries(
    expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.name] = (acc[t.name] || 0) + Math.abs(t.displayAmount);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const institution = institutions[0]
    ? `${institutions[0].institutionName} ••${institutions[0].accounts[0]?.mask ?? "—"}`
    : "Your Account";

  const filtered = catFilter ? transactions.filter((t) => t.category === catFilter) : transactions;
  const pct = (n: number) => (spent > 0 ? Math.round((n / spent) * 100) : 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'DM Sans',sans-serif", color: "#111110" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes aidot   { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        .card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:14px; padding:22px 24px; }
        .chip { display:inline-block; font-size:10px; font-weight:500; padding:3px 10px; border-radius:100px; white-space:nowrap; }
        .pill { display:inline-flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.04em;padding:8px 16px;border-radius:100px;border:0.5px solid rgba(0,0,0,0.16);background:transparent;color:#111110;cursor:pointer;text-decoration:none;transition:background 0.12s; }
        .pill:hover { background:rgba(0,0,0,0.04); }
        .pill.filled { background:#111110;color:#F8F7F4;border-color:#111110; }
        .pill.filled:hover { background:#2a2a28; }
        .tab { font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;padding:7px 16px;border-radius:100px;border:none;cursor:pointer;transition:all 0.15s; }
        .tab.active { background:#111110;color:#F8F7F4; }
        .tab.inactive { background:transparent;color:rgba(0,0,0,0.35); }
        .tab.inactive:hover { background:rgba(0,0,0,0.05);color:#111110; }
        .tx-row { display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:0.5px solid rgba(0,0,0,0.05);font-size:12.5px; }
        .tx-row:last-child { border-bottom:none; }
        select.inp { background:#fff;border:0.5px solid rgba(0,0,0,0.12);border-radius:100px;padding:7px 32px 7px 14px;font-size:11px;font-family:'DM Sans',sans-serif;color:#111110;outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center; }
        button:disabled { opacity: 0.45; cursor: default; }
      `}</style>

      {/* ── Nav ────────────────────────────────────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        background: "#F8F7F4", position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "blur(12px)",
      }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/dashboard" className="pill">Dashboard</Link>
          <button className="pill" onClick={() => exportCSV(transactions)} disabled={loading || transactions.length === 0}>
            Export CSV
          </button>
          <button className="pill filled" onClick={() => downloadPDF(transactions, income, spent, net, institution)} disabled={loading || transactions.length === 0}>
            ↓ Download PDF
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "44px 32px 80px" }}>

        {/* ── Page header ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "36px" }} className="fade-up">
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "10px" }}>
            {loading ? "Loading…" : `${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · ${institution}`}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "40px", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: "8px" }}>
            Expense report.
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", fontWeight: 300 }}>
            {loading ? "Fetching your transactions…" : `${transactions.length} transactions · AI categorized by Claude`}
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: "#fee2e2", border: "0.5px solid #fca5a5",
            borderRadius: "10px", padding: "12px 18px", marginBottom: "20px",
            fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "#991b1b",
          }}>
            {error}
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Total spent",  value: loading ? null : fmt(spent),  sub: `${expenses.length} expenses` },
            { label: "Total income", value: loading ? null : fmt(income), sub: `${deposits.length} deposits`, green: true },
            { label: "Net balance",  value: loading ? null : `${net >= 0 ? "+" : ""}${fmt(Math.abs(net))}`, sub: net >= 0 ? "Surplus" : "Deficit", green: net >= 0 },
          ].map((s) => (
            <div key={s.label} className="card fade-up">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "10px" }}>
                {s.label}
              </div>
              {s.value === null
                ? <Skeleton w="65%" h="30px" radius="4px" />
                : <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "26px", color: s.green ? "#065f46" : "#111110", marginBottom: "4px" }}>{s.value}</div>
              }
              <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.35)", fontWeight: 300, marginTop: "6px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Quick insight cards ───────────────────────────────────────────────── */}
        {!loading && topCat && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              {
                label: "Top category", mono: false,
                main: <span className="chip" style={{ background: getCatStyle(topCat[0]).bg, color: getCatStyle(topCat[0]).color, fontSize: "13px", padding: "4px 12px" }}>{topCat[0]}</span>,
                sub: `${pct(topCat[1])}% of spending · ${fmt(topCat[1])}`,
              },
              {
                label: "Avg. transaction", mono: true,
                main: <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px" }}>{fmt(avgTx)}</div>,
                sub: `across ${expenses.length} expenses`,
              },
              {
                label: "Most active day", mono: false,
                main: <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "28px" }}>{mostActiveDay}</div>,
                sub: "by spending volume",
              },
            ].map((s) => (
              <div key={s.label} className="card fade-up">
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "10px" }}>{s.label}</div>
                <div style={{ marginBottom: "4px" }}>{s.main}</div>
                <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.35)", fontWeight: 300, marginTop: "6px" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI Panel ─────────────────────────────────────────────────────────── */}
        {!loading && transactions.length > 0 && (
          <AIInsightPanel transactions={transactions} income={income} spent={spent} net={net} />
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          <button className={`tab ${activeTab === "overview" ? "active" : "inactive"}`} onClick={() => setActiveTab("overview")}>Overview</button>
          <button className={`tab ${activeTab === "transactions" ? "active" : "inactive"}`} onClick={() => setActiveTab("transactions")}>All Transactions</button>
        </div>

        {/* ══ OVERVIEW TAB ═══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            {/* Category breakdown — full width */}
            <div className="card fade-up" style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "20px" }}>
                Spending by category
              </div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[70, 55, 45, 35, 25].map((w, i) => (
                    <div key={i}>
                      <Skeleton w={`${w}%`} h="11px" />
                      <div style={{ marginTop: "8px" }}><Skeleton w="100%" h="5px" radius="100px" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {catTotals.filter(([c]) => c !== "Income").map(([cat, total]) => {
                    const cs = getCatStyle(cat);
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="chip" style={{ background: cs.bg, color: cs.color }}>{cat}</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>{pct(total)}%</span>
                          </div>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{fmt(total)}</span>
                        </div>
                        <div style={{ height: "5px", background: "rgba(0,0,0,0.05)", borderRadius: "100px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct(total)}%`, background: cs.bar, borderRadius: "100px", transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Day heatmap */}
            <div className="card fade-up">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "18px" }}>
                Spend by day of week
              </div>
              {loading ? <Skeleton w="100%" h="120px" radius="8px" /> : <SpendingHeatmap transactions={transactions} />}
            </div>

            {/* Top merchants */}
            <div className="card fade-up">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "18px" }}>
                Top merchants
              </div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} w={`${85 - i * 10}%`} h="13px" />)}
                </div>
              ) : (
                <div>
                  {topMerchants.map(([name, total], i) => (
                    <div key={name} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 0",
                      borderBottom: i < topMerchants.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none",
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: 500 }}>{name}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "11.5px", color: "rgba(0,0,0,0.45)" }}>{fmt(total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TRANSACTIONS TAB ═══════════════════════════════════════════════════ */}
        {activeTab === "transactions" && (
          <div className="card fade-up" style={{ padding: 0, overflow: "hidden" }}>
            {/* toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 22px", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
              <select className="inp" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">All categories</option>
                {Object.keys(CAT_STYLES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>
                {filtered.length} transactions
              </div>
            </div>

            {/* column headers */}
            <div style={{ display: "flex", gap: "12px", padding: "9px 22px", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
              {["Merchant", "Date", "Category", "Amount"].map((h, i) => (
                <div key={h} style={{
                  fontFamily: "'DM Mono',monospace", fontSize: "9px", letterSpacing: "0.07em",
                  textTransform: "uppercase", color: "rgba(0,0,0,0.25)",
                  flex: i === 0 ? 1 : "none",
                  width: i === 1 ? "68px" : i === 2 ? "130px" : "80px",
                  textAlign: i === 3 ? "right" : "left",
                }}>{h}</div>
              ))}
            </div>

            <div style={{ padding: "0 22px" }}>
              {/* loading skeletons */}
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="tx-row">
                  <div style={{ flex: 1 }}><Skeleton w={`${50 + (i % 3) * 15}%`} h="13px" /></div>
                  <div style={{ width: "68px" }}><Skeleton w="100%" h="13px" /></div>
                  <div style={{ width: "130px" }}><Skeleton w="80%" h="20px" radius="100px" /></div>
                  <div style={{ width: "80px", display: "flex", justifyContent: "flex-end" }}><Skeleton w="70%" h="13px" /></div>
                </div>
              ))}

              {/* rows */}
              {!loading && filtered.map((tx, i) => {
                const cs = getCatStyle(tx.category);
                return (
                  <div key={tx.transaction_id || i} className="tx-row">
                    <div style={{ flex: 1, fontWeight: 500 }}>{tx.name}</div>
                    <div style={{ width: "68px", fontFamily: "'DM Mono',monospace", fontSize: "10.5px", color: "rgba(0,0,0,0.3)" }}>
                      {tx.date.slice(5)}
                    </div>
                    <div style={{ width: "130px" }}>
                      <span className="chip" style={{ background: cs.bg, color: cs.color }}>{tx.category}</span>
                    </div>
                    <div style={{
                      width: "80px", fontFamily: "'DM Mono',monospace", fontSize: "12.5px",
                      textAlign: "right", color: tx.displayAmount > 0 ? "#065f46" : "#111110",
                    }}>
                      {tx.displayAmount > 0 ? "+" : ""}{fmt(Math.abs(tx.displayAmount))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* footer totals */}
            {!loading && (
              <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 22px", display: "flex", justifyContent: "flex-end", gap: "32px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "4px" }}>Total spent</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "15px" }}>{fmt(spent)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "4px" }}>Net</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "15px", color: net >= 0 ? "#065f46" : "#111110" }}>
                    {net >= 0 ? "+" : ""}{fmt(Math.abs(net))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: "28px", textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.2)", letterSpacing: "0.04em" }}>
          Generated by receipt.it · Powered by Claude AI
        </div>
      </div>
    </div>
  );
}
