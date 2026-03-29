// routes/ai.js
import express from "express";
import { requireAuth } from "./middlewares/auth.js"

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { transactions, income, spent, net } = req.body;
  transactions = []
  icome = 1200
  spent = 2819.4
  net = 9180.6
  console.log("here", income, spent, net)

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const fmt = (n) => `$${Number(n).toFixed(2)}`;

  const catTotals = Object.entries(
    transactions
      .filter((t) => t.displayAmount < 0)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.displayAmount);
        return acc;
      }, {})
  ).sort((a, b) => b[1] - a[1]);

  const summary = `
Monthly Financial Summary:
- Total Income: ${fmt(income)}
- Total Spent: ${fmt(spent)}
- Net: ${fmt(net)} (${net >= 0 ? "surplus" : "deficit"})
- Transactions: ${transactions.length}

Spending by Category:
${catTotals
  .map(
    ([cat, total]) =>
      `  ${cat}: ${fmt(total)} (${Math.round((total / spent) * 100)}%)`
  )
  .join("\n")}

Top 5 Transactions:
${transactions
  .filter((t) => t.displayAmount < 0)
  .sort((a, b) => Math.abs(b.displayAmount) - Math.abs(a.displayAmount))
  .slice(0, 5)
  .map((t) => `  ${t.name}: ${fmt(Math.abs(t.displayAmount))}`)
  .join("\n")}
`.trim();

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        stream: true,
        system: `You are a sharp, insightful personal finance advisor.
Analyze the user's monthly spending data and produce a concise, structured report.
Use plain text only — no markdown, no asterisks, no bullet dashes, no headers with #.
Organize your response into 3 short paragraphs:
1. Overall financial health summary (2-3 sentences)
2. Key spending patterns and notable observations (2-3 sentences)
3. 2-3 specific, actionable recommendations (2-3 sentences)
Be direct, specific, and encouraging. Reference actual numbers and merchant names.`,
        messages: [
          {
            role: "user",
            content: `Here is my monthly financial data:\n\n${summary}\n\nGive me a concise financial analysis.`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json();
      console.error("Anthropic error:", err);
      return res.status(anthropicRes.status).json({ error: err });
    }

    // Set SSE headers before streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Web Streams API reader — works with native Node fetch
    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error("AI route error:", err);
    // Only send error header if we haven't started streaming yet
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
});

export default router;
