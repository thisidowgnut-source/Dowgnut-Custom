const BILLPLZ_PAYMENT_HOSTS = new Set([
  "www.billplz.com",
  "www.billplz-sandbox.com",
]);

/** Allow navigation only to Billplz's HTTPS payment origins. */
export function isAllowedBillplzPaymentUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      BILLPLZ_PAYMENT_HOSTS.has(url.hostname) &&
      (url.port === "" || url.port === "443") &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}
