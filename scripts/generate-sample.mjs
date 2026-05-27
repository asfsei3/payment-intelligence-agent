// Generate a deterministic sample CSV of payment failures.
// No PII, no PAN, no real customer data. JPY amounts only.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "sample", "payment_failures_sample.csv");

// Deterministic PRNG (mulberry32) so output is stable.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260526);

const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const TIERS = [980, 1980, 2980, 4980, 9800, 14800, 29800];

const ERROR_LIBRARY = [
  { code: "expired_card", msg: "Card has expired", cat: "customer", weight: 12 },
  { code: "authentication_required", msg: "3D Secure authentication required", cat: "customer", weight: 7 },
  { code: "card_declined_authentication", msg: "Issuer declined authentication", cat: "customer", weight: 4 },
  { code: "payment_method_required", msg: "Customer has no active payment method", cat: "customer", weight: 4 },
  { code: "card_update_required", msg: "Card network signaled update required", cat: "customer", weight: 3 },

  { code: "insufficient_funds", msg: "Insufficient funds", cat: "safe", weight: 10 },
  { code: "temporary_failure", msg: "Temporary processing failure", cat: "safe", weight: 4 },
  { code: "processing_error", msg: "Processing error", cat: "safe", weight: 3 },
  { code: "network_error", msg: "Network timeout to issuer", cat: "safe", weight: 3 },
  { code: "issuer_unavailable", msg: "Issuer temporarily unavailable", cat: "safe", weight: 2 },

  { code: "stolen_card", msg: "Stolen card reported", cat: "dnr", weight: 3 },
  { code: "lost_card", msg: "Lost card reported", cat: "dnr", weight: 3 },
  { code: "fraudulent", msg: "Suspected fraud", cat: "dnr", weight: 2 },
  { code: "invalid_card", msg: "Invalid card details", cat: "dnr", weight: 2 },

  { code: "do_not_honor", msg: "Issuer declined: do not honor", cat: "manual", weight: 9 },
  { code: "generic_decline", msg: "Generic decline by issuer", cat: "manual", weight: 5 },
  { code: "unknown", msg: "Unknown error", cat: "manual", weight: 4 },
];

function weightedPick() {
  const total = ERROR_LIBRARY.reduce((s, e) => s + e.weight, 0);
  let r = rand() * total;
  for (const e of ERROR_LIBRARY) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return ERROR_LIBRARY[0];
}

function dateInMay2026() {
  const day = between(1, 26);
  const hour = between(0, 23);
  const min = between(0, 59);
  const sec = between(0, 59);
  return `2026-05-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;
}

function dateInApril2026() {
  const day = between(1, 30);
  const hour = between(0, 23);
  const min = between(0, 59);
  return `2026-04-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`;
}

const TOTAL = 80;
const rows = [];
const headers = [
  "transaction_id",
  "customer_id",
  "amount",
  "currency",
  "failed_at",
  "error_code",
  "error_message",
  "attempt_count",
  "last_success_at",
  "subscription_status",
];

// Guarantee at least one row per error code so every demo surface has data.
const picks = [];
for (const e of ERROR_LIBRARY) picks.push(e);
while (picks.length < TOTAL) picks.push(weightedPick());
// Shuffle deterministically.
for (let i = picks.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [picks[i], picks[j]] = [picks[j], picks[i]];
}

for (let i = 1; i <= TOTAL; i++) {
  const err = picks[i - 1];
  let status;
  if (err.cat === "dnr") {
    status = pick(["canceled", "past_due", "paused"]);
  } else if (err.cat === "customer") {
    status = pick(["active", "past_due", "active", "active"]);
  } else if (err.cat === "safe") {
    status = pick(["active", "past_due", "active", "active", "trialing"]);
  } else {
    status = pick(["active", "past_due", "active", "paused"]);
  }

  // attempt_count: safe codes usually 1-3, others vary
  const attempt =
    err.cat === "safe"
      ? between(1, 3)
      : err.cat === "dnr"
        ? between(1, 2)
        : between(1, 4);

  rows.push({
    transaction_id: `txn_2026_${String(10000 + i).padStart(5, "0")}`,
    customer_id: `cus_${String(1000 + i).padStart(4, "0")}`,
    amount: String(pick(TIERS)),
    currency: "JPY",
    failed_at: dateInMay2026(),
    error_code: err.code,
    error_message: err.msg,
    attempt_count: String(attempt),
    last_success_at: dateInApril2026(),
    subscription_status: status,
  });
}

// Light CSV escape: wrap in quotes if value contains comma or quote.
function esc(v) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

const csv = [
  headers.join(","),
  ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
].join("\n");

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, csv + "\n", "utf8");

// Summary
const counts = rows.reduce((acc, r) => {
  acc[r.error_code] = (acc[r.error_code] || 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${rows.length} rows to ${OUT_PATH}`);
console.log("Counts:", counts);
