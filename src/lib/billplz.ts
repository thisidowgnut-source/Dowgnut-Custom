/**
 * Billplz payment gateway helper.
 *
 * Sandbox: https://www.billplz-sandbox.com
 * Production: https://www.billplz.com
 *
 * Env vars required:
 *   BILLPLZ_API_KEY          — secret API key from Billplz dashboard
 *   BILLPLZ_COLLECTION_ID    — collection id (optional — falls back to env on first create)
 *   BILLPLZ_X_SIGNATURE_KEY  — X-Signature key for webhook verification
 *   BILLPLZ_SANDBOX          — "true" / "false" (default "true" in dev)
 *   NEXT_PUBLIC_BASE_URL     — used to build redirect URLs
 */

const SANDBOX = process.env.BILLPLZ_SANDBOX !== "false"; // sandbox UNLESS explicitly live
const BASE = SANDBOX ? "https://www.billplz-sandbox.com" : "https://www.billplz.com";
const API_V3 = `${BASE}/api/v3`;

export interface BillplzConfig {
  apiKey: string;
  collectionId: string;
  signatureKey: string;
  sandbox: boolean;
}

export function getBillplzConfig(): BillplzConfig | null {
  const apiKey = process.env.BILLPLZ_API_KEY;
  const collectionId = process.env.BILLPLZ_COLLECTION_ID;
  const signatureKey = process.env.BILLPLZ_X_SIGNATURE_KEY;
  if (!apiKey || !collectionId || !signatureKey) return null;
  return { apiKey, collectionId, signatureKey, sandbox: SANDBOX };
}

export interface CreateBillInput {
  /** Amount in MYR (will be converted to sen below) */
  amount: number;
  description: string;
  /** Internal order id — used for callback matching */
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  /** Absolute URL Billplz redirects to after successful payment */
  redirectUrl: string;
  /** Absolute URL Billplz posts webhooks to */
  callbackUrl: string;
}

export interface BillplzBill {
  id: string;
  collection_id: string;
  paid: boolean;
  state: string;
  amount: number; // in sen
  paid_amount: number;
  due_at: string;
  email: string;
  mobile: string;
  name: string;
  url: string; // hosted payment URL
  reference_1_label?: string;
  reference_1?: string;
  redirect_url?: string;
  callback_url?: string;
  created_at: string;
  updated_at: string;
}

const auth = (cfg: BillplzConfig) =>
  "Basic " + Buffer.from(`${cfg.apiKey}:`).toString("base64");

/**
 * Create a Billplz bill and return the hosted payment URL.
 * Returns null if Billplz is not configured (dev mode).
 */
export async function createBill(
  cfg: BillplzConfig,
  input: CreateBillInput,
): Promise<BillplzBill> {
  const body = new URLSearchParams({
    collection_id: cfg.collectionId,
    description: input.description.slice(0, 199),
    reference_1_label: "Order",
    reference_1: input.referenceId,
    name: input.customerName.slice(0, 255),
    email: input.customerEmail,
    mobile: input.customerPhone.replace(/[^0-9+]/g, ""),
    amount: String(Math.round(input.amount * 100)), // MYR → sen
    deliver: "false",
    redirect_url: input.redirectUrl,
    callback_url: input.callbackUrl,
  });

  const res = await fetch(`${API_V3}/bills`, {
    method: "POST",
    headers: {
      Authorization: auth(cfg),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Billplz error ${res.status}: ${text}`);
  }
  return (await res.json()) as BillplzBill;
}

/**
 * Verify a Billplz webhook (redirect/callback) signature.
 *
 * Per Billplz docs, the signed string is built from the POST form fields:
 *   1. Drop the `x_signature` field itself.
 *   2. For every remaining field, concatenate `key + value` (e.g. `amount100`).
 *   3. Sort those concatenations ascending, case-insensitive.
 *   4. Join with `|`.
 *   5. Signature = hex(HMAC-SHA256(X-Signature key, that string)).
 *
 * The signature itself arrives as the `x_signature` FORM FIELD (not a header).
 */
export async function verifyWebhook(
  cfg: BillplzConfig,
  rawBody: string,
  providedSignature: string | null,
): Promise<boolean> {
  if (!providedSignature) return false;

  const params = new URLSearchParams(rawBody);
  params.delete("x_signature");

  const source = [...params.entries()]
    .map(([k, v]) => `${k}${v}`)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .join("|");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(cfg.signatureKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(source));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(hex, providedSignature.toLowerCase());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
