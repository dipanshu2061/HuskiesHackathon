# receipt.it — API Reference

Backend REST API for receipt.it. Built with Express.js, integrating Plaid for transaction data and Anthropic Claude for AI-powered financial analysis.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /plaid/transactions/get](#get-plaidtransactionsget)
  - [POST /ai/analyze](#post-aianalyze)
- [SSE Streaming](#sse-streaming)
- [Error Codes](#error-codes)
- [Data Types](#data-types)
- [Category Mapping](#category-mapping)

---

## Authentication

All endpoints require a JWT bearer token issued by your auth service.

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

The frontend reads the token from `localStorage.getItem("token")` and attaches it to every request. Requests with a missing or invalid token receive `401 Unauthorized` from the `requireAuth` middleware.

---

## Endpoints

### GET /plaid/transactions/get

Fetches all transactions across every institution the authenticated user has linked via Plaid Link.

**Auth required:** yes

**Request body:** none

**Response — 200 OK**

```json
{
  "results": [
    {
      "itemId": "item_sandbox_abc123",
      "institutionName": "Chase",
      "accounts": [
        {
          "accountId": "acc_xyz",
          "name": "Checking",
          "mask": "4821"
        }
      ],
      "transactions": [
        {
          "transaction_id": "txn_001",
          "name": "Whole Foods Market",
          "date": "2025-03-14",
          "amount": 312.40,
          "account_id": "acc_xyz",
          "personal_finance_category": {
            "primary": "FOOD_AND_DRINK"
          }
        }
      ]
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `results` | `PlaidResult[]` | One entry per linked Plaid item |
| `results[].itemId` | `string` | Plaid item identifier |
| `results[].institutionName` | `string` | Human-readable bank name |
| `results[].accounts` | `Account[]` | Accounts under this institution |
| `results[].transactions` | `Transaction[]` | All transactions across accounts |

> **Note on amount sign convention:** Plaid uses positive `amount` for debits (money leaving the account) and negative for credits. The frontend inverts this into `displayAmount = -amount` so positive means income and negative means spending.

---

### POST /ai/analyze

Streams a Claude-generated financial insight report as server-sent events. The backend builds a plain-text summary from the request body, sends it to the Anthropic Messages API with `stream: true`, and proxies the raw SSE chunks directly to the client.

**Auth required:** yes  
**Response type:** `text/event-stream` (SSE — not JSON)

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `transactions` | `NormalizedTx[]` | yes | Full transaction array with `displayAmount` and `category` already normalized |
| `income` | `number` | yes | Total income for the period in USD |
| `spent` | `number` | yes | Total amount spent (absolute value) in USD |
| `net` | `number` | yes | `income - spent`. Negative value = deficit |

**Example request**

```js
const res = await fetch("http://localhost:5000/api/ai/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify({ transactions, income, spent, net }),
});

// res.body is a ReadableStream — see SSE Streaming below
```

**What gets sent to Claude**

The route builds a `summary` string from the request data and sends it as the user message. The system prompt instructs Claude to respond in three plain-text paragraphs (no markdown):

1. Overall financial health summary (2–3 sentences)
2. Key spending patterns and notable observations (2–3 sentences)
3. 2–3 specific, actionable recommendations referencing real numbers and merchant names

**Error responses**

| Status | Condition |
|---|---|
| `400` | Missing or non-array `transactions` field |
| `401` | Missing or invalid JWT |
| `4xx / 5xx` | Anthropic API error — status and body forwarded directly |
| `500` | Internal error before streaming starts; returns `{"error":"..."}` |

> **Known bug:** The route currently reassigns the destructured request parameters (`transactions = []`, `icome = 1200`, etc.) on lines 8–12 of `routes/ai.js`. These reassignments are silently ignored and `icome` is a typo for `income`. Remove those lines so the actual request values reach the summary builder.

---

## SSE Streaming

The `/ai/analyze` endpoint forwards Anthropic's SSE protocol verbatim. Events arrive as newline-delimited `data: <json>` lines.

**Event sequence**

| Event | Description |
|---|---|
| `message_start` | Sent once. Contains model metadata. Safe to ignore. |
| `content_block_start` | Marks the start of a content block (`index: 0`). |
| `content_block_delta` | **Repeated for every chunk.** Append `evt.delta.text` to your output string. |
| `content_block_stop` | Marks the end of the content block. |
| `message_delta` | Final token usage stats. Safe to ignore. |
| `message_stop` | Stream complete. |

**Parsing example**

```ts
const reader  = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? ""; // keep incomplete last line

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const json = line.slice(6).trim();
    if (json === "[DONE]") continue;
    try {
      const evt = JSON.parse(json);
      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
        setInsight(prev => prev + evt.delta.text); // append chunk to state
      }
    } catch { /* malformed chunk — skip */ }
  }
}
```

> **Error handling during streaming:** Once SSE headers have been sent, HTTP status codes can no longer be used to signal errors. If an error occurs mid-stream the connection closes. Check `res.headersSent` server-side before deciding whether to send a JSON error or just close the stream.

---

## Error Codes

| Status | Meaning | Response format |
|---|---|---|
| `200` | Success | JSON or `text/event-stream` |
| `400` | Bad request | `{"error": "Invalid request body"}` |
| `401` | Unauthorized — invalid or missing JWT | Set by `requireAuth` middleware |
| `500` | Internal server error (pre-stream) | `{"error": "..."}` |

---

## Data Types

```ts
interface Transaction {
  transaction_id:             string;
  name:                       string;
  date:                       string;   // "YYYY-MM-DD"
  amount:                     number;   // Plaid: positive = debit
  personal_finance_category?: { primary: string };
  account_id:                 string;
}

interface NormalizedTx extends Transaction {
  displayAmount: number;  // = -amount (positive = income, negative = spend)
  category:      string;  // mapped via PLAID_CAT_MAP
}

interface Account {
  accountId: string;
  name:      string;
  mask:      string;  // last 4 digits
}

interface PlaidResult {
  itemId:          string;
  institutionName: string;
  accounts:        Account[];
  transactions:    Transaction[];
}

// POST /ai/analyze request body
interface AnalyzeRequest {
  transactions: NormalizedTx[];
  income:       number;
  spent:        number;
  net:          number;
}
```

---

## Category Mapping

The frontend maps Plaid's `personal_finance_category.primary` values to display labels via `PLAID_CAT_MAP`. Transactions with a negative `amount` (credits) are automatically assigned the `"Income"` category regardless of their Plaid label.

| Plaid primary category | Display label |
|---|---|
| `FOOD_AND_DRINK` | Food & Dining |
| `TRAVEL` | Travel |
| `TRANSPORTATION` | Travel |
| `SHOPPING` | Shopping |
| `GENERAL_MERCHANDISE` | Shopping |
| `TRANSFER_OUT` | Shopping |
| `ENTERTAINMENT` | Entertainment |
| `MEDICAL` | Health |
| `PERSONAL_CARE` | Health |
| `HOME_IMPROVEMENT` | Home |
| `RENT_AND_UTILITIES` | Utilities |
| `GENERAL_SERVICES` | Services |
| `LOAN_PAYMENTS` | Loans |
| `BANK_FEES` | Fees |
| `INCOME` | Income |
| `TRANSFER_IN` | Income |
| `GOVERNMENT_AND_NON_PROFIT` | Other |
| *(unrecognized)* | Other |

---

*receipt.it · Powered by Claude AI*
