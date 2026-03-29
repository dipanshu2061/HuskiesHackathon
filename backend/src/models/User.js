// models/User.js
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
    official_name: String,
    accountId: String,
    name: String,
    mask: String,
    type: String,
    subtype: String,
    balances: {
      available: Number,
      current: Number,
      iso_currency_code: String,
    },
    holder_category: String,
    persistent_account_id: String,
  }, { _id: false })

const plaidItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true, // stored encrypted
    },
    institutionId: {
      type: String,
    },
    institutionName: {
      type: String,
    },
    accounts: [
      accountSchema
      /*
      {
        accountId: String,
        name: String,       // e.g. "Checking", "Savings"
        mask: String,       // last 4 digits e.g. "1234"
        type: String,       // "depository", "credit", etc.
        subtype: String,    // "checking", "savings", etc.
      },
      */
    ],
    cursor: {
      type: String,
      default: null, // used for Plaid transactions sync
    },
    status: {
      type: String,
      enum: ["active", "error", "disconnected"],
      default: "active",
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    // ── Auth ────────────────────────────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // store hashed (bcrypt)
    },
    name: {
      type: String,
      trim: true,
    },

    // ── Plaid ───────────────────────────────────────────────────────────────
    plaidItems: [plaidItemSchema], // one per connected bank

    // ── Meta ────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Instance methods ─────────────────────────────────────────────────────────

// Add a new linked bank
userSchema.methods.addPlaidItem = function (itemData) {
  this.plaidItems.push(itemData);
  return this.save();
};

// Remove a linked bank by itemId
userSchema.methods.removePlaidItem = function (itemId) {
  this.plaidItems = this.plaidItems.filter((item) => item.itemId !== itemId);
  return this.save();
};

// Get a single plaid item by itemId
userSchema.methods.getPlaidItem = function (itemId) {
  return this.plaidItems.find((item) => item.itemId === itemId);
};

// Update item status (e.g. on webhook error)
userSchema.methods.updatePlaidItemStatus = function (itemId, status) {
  const item = this.getPlaidItem(itemId);
  if (item) {
    item.status = status;
    return this.save();
  }
};

export default mongoose.model("User", userSchema);
