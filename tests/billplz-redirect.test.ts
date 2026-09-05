import { describe, expect, test } from "bun:test";

import { isAllowedBillplzPaymentUrl } from "@/lib/billplz-redirect";

describe("isAllowedBillplzPaymentUrl", () => {
  test.each([
    "https://www.billplz.com/bills/live-bill",
    "https://www.billplz-sandbox.com/bills/test-bill",
  ])("accepts an official HTTPS Billplz URL: %s", (url) => {
    expect(isAllowedBillplzPaymentUrl(url)).toBe(true);
  });

  test.each([
    "http://www.billplz.com/bills/insecure",
    "https://billplz.com.evil.example/bills/phishing",
    "https://www.billplz.com@evil.example/bills/phishing",
    "javascript:alert(1)",
    "not-a-url",
  ])("rejects an unsafe gateway URL: %s", (url) => {
    expect(isAllowedBillplzPaymentUrl(url)).toBe(false);
  });
});
