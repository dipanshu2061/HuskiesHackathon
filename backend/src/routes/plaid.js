import express from "express";
import {Products, CountryCode} from "plaid";

import {plaidClient} from "../../index.js"
import { requireAuth } from "./middlewares/auth.js";
import User from "../models/User.js";


const router = express.Router()


// ── 1. Create a Link token ────────────────────────────────────────────────────ai
// Frontend calls this to initialise Plaid Link
router.post("/link/token/create", requireAuth,async (req, res) => {


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
router.post("/item/public_token/exchange", requireAuth,async (req, res) => {
  const { public_token } = req.body;
  if (!public_token) return res.status(400).json({ error: "public_token required" });

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;
    const user = await User.findById(req.userId)

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token: access_token });
    const institutionId = itemResponse.data.item.institution_id;

    let institutionName = null;
    if (institutionId) {
      const instResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ["US"],
      });
      institutionName = instResponse.data.institution.name;
    }

    const accountsResponse = await plaidClient.accountsGet({ access_token: access_token });
    console.log(accountsResponse.data.accounts)
    const accounts = accountsResponse.data.accounts.map((a) => ({
      accountId: a.account_id,
      official_name: a.official_name,
      name: a.name,
      type: a.type,
      mask: a.mask,
      subtype: a.subtype,
      balances: {
        available: a.balances.available,
        current: a.balances.current,
        iso_currency_code: a.balances.iso_currency_code
      },
      holder_category: a.holder_category,
      persistent_account_id: a.persistent_account_id,
    }))


    if (!user){
      console.log("user not found")
      return res.status(404).json({error: "User not Found"})
    }


    const ss = await user.addPlaidItem({
      itemId: item_id,
      accessToken: access_token,
      accounts: accounts,
      institutionName,
    })
    // ⚠️  Store access_token + item_id in your DB — never expose access_token to the client
    res.json({ item_id, institution: institutionName, message: "Access token stored securely (check server logs for demo)" });
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ── 3. Get account balances ───────────────────────────────────────────────────
// Requires the access_token stored after exchange (passed via body here for demo)
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
// ── 4. Get transactions ───────────────────────────────────────────────────────
// ── 4. Get transactions ───────────────────────────────────────────────────────
router.get("/transactions/get", requireAuth, async (req, res) => {
  const { start_date, end_date, item_id } = req.query;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.plaidItems || user.plaidItems.length === 0)
      return res.status(404).json({ error: "No linked bank accounts found" });

    // If item_id is provided, only fetch for that item — otherwise fetch all
    const itemsToFetch = item_id
      ? user.plaidItems.filter((item) => item.itemId === item_id)
      : user.plaidItems.filter((item) => item.status === "active");

    if (itemsToFetch.length === 0)
      return res.status(404).json({ error: "No matching active items found" });

    const startDate = start_date || "2024-01-01";
    const endDate = end_date || new Date().toISOString().split("T")[0];

    // Fetch transactions for all items in parallel
    const results = await Promise.allSettled(
      itemsToFetch.map(async (plaidItem) => {
        let allTransactions = [];
        let totalTransactions = null;
        let offset = 0;
        const count = 100;

        // Paginate through all transactions
        do {
          const response = await plaidClient.transactionsGet({
            access_token: plaidItem.accessToken,
            start_date: startDate,
            end_date: endDate,
            options: { count, offset },
          });

          const { transactions, total_transactions } = response.data;
          totalTransactions = total_transactions;
          allTransactions = allTransactions.concat(transactions);
          offset += transactions.length;
        } while (allTransactions.length < totalTransactions);

        return {
          itemId: plaidItem.itemId,
          institutionName: plaidItem.institutionName,
          accounts: plaidItem.accounts,
          transactions: allTransactions,
          total_transactions: totalTransactions,
        };
      })
    );

    // Separate successes from failures
    const succeeded = [];
    const failed = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        succeeded.push(result.value);
      } else {
        console.error(`Failed to fetch transactions for item ${itemsToFetch[i].itemId}:`, result.reason);
        failed.push({
          itemId: itemsToFetch[i].itemId,
          institutionName: itemsToFetch[i].institutionName,
          error: result.reason?.response?.data?.error_message || result.reason?.message || "Unknown error",
        });

        // Mark errored items in DB
        user.updatePlaidItemStatus(itemsToFetch[i].itemId, "error").catch(console.error);
      }
    });

    res.json({
      start_date: startDate,
      end_date: endDate,
      results: succeeded,
      ...(failed.length > 0 && { errors: failed }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});
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
