import express from "express";
import {Products, CountryCode} from "plaid";

import {plaidClient} from "../../index.js"


const router = express.Router()


// ── 1. Create a Link token ────────────────────────────────────────────────────
// Frontend calls this to initialise Plaid Link
router.post("/link/token/create", async (req, res) => {
  console.log(process.env.APP_NAME)
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.body.userId || "user-sandbox-1" },
      client_name: process.env.APP_NAME || "My App",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ── 2. Exchange public token for access token ─────────────────────────────────
// Call this after the user completes Plaid Link
router.post("/item/public_token/exchange", async (req, res) => {
  const { public_token } = req.body;
  if (!public_token) return res.status(400).json({ error: "public_token required" });

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    // ⚠️  Store access_token + item_id in your DB — never expose access_token to the client
    const { access_token, item_id } = response.data;
    console.log("Item linked:", { item_id });
    res.json({ item_id, message: "Access token stored securely (check server logs for demo)" });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ── 3. Get account balances ───────────────────────────────────────────────────
// Requires the access_token stored after exchange (passed via body here for demo)
/*
router.post("/accounts/balance/get", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "access_token required" });

  try {
    const response = await plaidClient.accountsBalanceGet({ access_token });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});
*/
// ── 4. Get transactions ───────────────────────────────────────────────────────
/*
router.post("/transactions/get", async (req, res) => {
  const { access_token, start_date, end_date } = req.body;
  if (!access_token) return res.status(400).json({ error: "access_token required" });

  try {
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: start_date || "2024-01-01",
      end_date: end_date || new Date().toISOString().split("T")[0],
      options: { count: 100, offset: 0 },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});
*/
// ── 5. Webhook handler ────────────────────────────────────────────────────────
/*
router.post("/webhook", (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body;
  console.log(`Webhook received: ${webhook_type}/${webhook_code} for item ${item_id}`);
  // Handle TRANSACTIONS_REMOVED, DEFAULT_UPDATE, etc. here
  res.sendStatus(200);
});
*/

export default router
