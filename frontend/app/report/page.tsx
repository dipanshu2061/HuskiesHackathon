"use client";

import Link from "next/link";

const TRANSACTIONS = [
  { name: "WHOLE FOODS MARKET",    date: "2026-03-27", amount: -84.32,  category: "Food & Dining" },
  { name: "DELTA AIR LINES",       date: "2026-03-26", amount: -412.00, category: "Travel" },
  { name: "NETFLIX.COM",           date: "2026-03-25", amount: -15.49,  category: "Entertainment" },
  { name: "PAYROLL DEPOSIT",       date: "2026-03-24", amount: 3200.00, category: "Income" },
  { name: "STARBUCKS #04821",      date: "2026-03-24", amount: -7.85,   category: "Food & Dining" },
  { name: "AMAZON.COM",            date: "2026-03-23", amount: -134.99, category: "Shopping" },
  { name: "WALGREENS PHARMACY",    date: "2026-03-23", amount: -23.41,  category: "Health" },
  { name: "UBER TRIP",             date: "2026-03-22", amount: -18.70,  category: "Travel" },
  { name: "CHIPOTLE MEXICAN GRILL",date: "2026-03-22", amount: -13.25,  category: "Food & Dining" },
  { name: "STAPLES #0821",         date: "2026-03-21", amount: -46.80,  category: "Office Supplies" },
  { name: "SPOTIFY USA",           date: "2026-03-20", amount: -9.99,   category: "Entertainment" },
  { name: "TARGET STORES",         date: "2026-03-20", amount: -67.44,  category: "Shopping" },
  { name: "HILTON HOTELS",         date: "2026-03-19", amount: -289.00, category: "Travel" },
  { name: "TRADER JOES #142",      date: "2026-03-18", amount: -55.20,  category: "Food & Dining" },
  { name: "APPLE.COM/BILL",        date: "2026-03-17", amount: -2.99,   category: "Entertainment" },
  { name: "CVS PHARMACY",          date: "2026-03-16", amount: -31.60,  category: "Health" },
  { name: "SOUTHWEST AIRLINES",    date: "2026-03-15", amount: -198.00, category: "Travel" },
  { name: "MCDONALDS #8821",       date: "2026-03-15", amount: -9.47,   category: "Food & Dining" },
  { name: "OFFICE DEPOT",          date: "2026-03-14", amount: -88.00,  category: "Office Supplies" },
  { name: "FREELANCE PAYMENT",     date: "2026-03-13", amount: 850.00,  category: "Income" },
];

const CAT_STYLES: Record<string, { bg: string; color: string; bar: string }> = {
  "Travel":          { bg: "#dbeafe", color: "#1e40af", bar: "#3b82f6" },
  "Food & Dining":   { bg: "#fef3c7", color: "#92400e", bar: "#f59e0b" },
  "Shopping":        { bg: "#ede9fe", color: "#4c1d95", bar: "#8b5cf6" },
  "Office Supplies": { bg: "#dcfce7", color: "#166534", bar: "#22c55e" },
  "Health":          { bg: "#fee2e2", color: "#991b1b", bar: "#ef4444" },
  "Entertainment":   { bg: "#fce7f3", color: "#9d174d", bar: "#ec4899" },
  "Income":          { bg: "#d1fae5", color: "#065f46", bar: "#10b981" },
};

export default function ReportPage() {
  const spent = TRANSACTIONS.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const income = TRANSACTIONS.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const net = income - spent;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  const pct = (n: number) => Math.round((n / spent) * 100);

  const catTotals = Object.entries(
    TRANSACTIONS.filter((t) => t.amount < 0).reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topCat = catTotals[0];
  const avgTx = spent / TRANSACTIONS.filter((t) => t.amount < 0).length;

  const exportCSV = () => {
    const rows = [
      ["Date", "Merchant", "Amount", "Type", "Category"],
      ...TRANSACTIONS.map((t) => [
        t.date, t.name, t.amount.toFixed(2),
        t.amount > 0 ? "Credit" : "Debit",
        t.category,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "receipt-it-report.csv";
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
        .card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:14px; padding:22px 24px; }
        .chip { display:inline-block; font-size:10px; font-weight:500; padding:3px 10px; border-radius:100px; white-space:nowrap; }
        .bar-track { height:5px; background:rgba(0,0,0,0.06); border-radius:100px; overflow:hidden; margin-top:6px; }
        .bar-fill { height:100%; border-radius:100px; transition:width 0.6s ease; }
        .divider { height:0.5px; background:rgba(0,0,0,0.07); margin:0; border:none; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", background: "#F8F7F4" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", letterSpacing: "-0.01em", color: "#111110", textDecoration: "none" }}>
          receipt<span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.3)" }}>.it</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/dashboard" className="pill-btn">Dashboard</Link>
          <button className="pill-btn filled" onClick={exportCSV}>Export CSV</button>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px 64px" }}>

        {/* Report header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "10px" }}>
            March 2026 · Chase Checking ••4821
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "36px", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "6px" }}>
            Expense report.
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", fontWeight: 300 }}>
            {TRANSACTIONS.length} transactions · AI categorized by Claude
          </p>
        </div>

        {/* Top stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total spent", value: fmt(spent), sub: `${TRANSACTIONS.filter(t => t.amount < 0).length} expenses` },
            { label: "Total income", value: fmt(income), sub: `${TRANSACTIONS.filter(t => t.amount > 0).length} deposits`, green: true },
            { label: "Net balance", value: (net >= 0 ? "+" : "") + fmt(Math.abs(net)), sub: net >= 0 ? "Surplus" : "Deficit", green: net >= 0 },
          ].map((s) => (
            <div key={s.label} className="card">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "10px" }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "24px", fontWeight: 400, color: s.green ? "#065f46" : "#111110", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Insights row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "12px", marginBottom: "24px" }}>
          <div className="card">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "10px" }}>Top category</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", fontWeight: 400 }}>{topCat[0]}</div>
              <span className="chip" style={{ background: CAT_STYLES[topCat[0]]?.bg || "#f3f4f6", color: CAT_STYLES[topCat[0]]?.color || "#374151" }}>{pct(topCat[1])}% of spend</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>{fmt(topCat[1])} across {TRANSACTIONS.filter(t => t.category === topCat[0]).length} transactions</div>
          </div>
          <div className="card">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "10px" }}>Average transaction</div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", fontWeight: 400, marginBottom: "4px" }}>{fmt(avgTx)}</div>
            <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>per expense across {TRANSACTIONS.filter(t => t.amount < 0).length} transactions</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "20px" }}>Spending by category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {catTotals.filter(([c]) => c !== "Income").map(([cat, total]) => {
              const cs = CAT_STYLES[cat] || { bg: "#f3f4f6", color: "#374151", bar: "#9ca3af" };
              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="chip" style={{ background: cs.bg, color: cs.color }}>{cat}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.28)" }}>{pct(total)}%</span>
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#111110" }}>{fmt(total)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct(total)}%`, background: cs.bar }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction list */}
        <div className="card">
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", marginBottom: "4px", padding: "0 0 16px" }}>All transactions</div>

          {/* Table header */}
          <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "0.5px solid rgba(0,0,0,0.07)", marginBottom: "2px" }}>
            {["Merchant", "Date", "Category", "Amount"].map((h, i) => (
              <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(0,0,0,0.25)", flex: i === 0 ? 1 : "none", width: i === 1 ? "68px" : i === 2 ? "130px" : "76px", textAlign: i === 3 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          {TRANSACTIONS.map((tx, i) => {
            const cs = CAT_STYLES[tx.category] || { bg: "#f3f4f6", color: "#374151" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < TRANSACTIONS.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none" }}>
                <div style={{ flex: 1, fontSize: "12.5px", fontWeight: 500, color: "#111110" }}>{tx.name}</div>
                <div style={{ width: "68px", fontFamily: "'DM Mono',monospace", fontSize: "10.5px", color: "rgba(0,0,0,0.3)" }}>{tx.date.slice(5)}</div>
                <div style={{ width: "130px" }}>
                  <span className="chip" style={{ background: cs.bg, color: cs.color }}>{tx.category}</span>
                </div>
                <div style={{ width: "76px", fontFamily: "'DM Mono',monospace", fontSize: "12.5px", textAlign: "right", color: tx.amount > 0 ? "#065f46" : "#111110" }}>
                  {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                </div>
              </div>
            );
          })}

          {/* Totals footer */}
          <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.1)", marginTop: "8px", paddingTop: "16px", display: "flex", justifyContent: "flex-end", gap: "32px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Total spent</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "16px", fontWeight: 400 }}>{fmt(spent)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(0,0,0,0.28)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Net</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "16px", fontWeight: 400, color: net >= 0 ? "#065f46" : "#111110" }}>{net >= 0 ? "+" : ""}{fmt(Math.abs(net))}</div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: "24px", textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(0,0,0,0.22)", letterSpacing: "0.04em" }}>
          Generated by receipt.it · Powered by Claude AI · Huskies Hackathon 2026
        </div>
      </div>
    </div>
  );
}

