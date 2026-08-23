
---
Task ID: p0-security-fixes
Agent: main (Z.ai Code)
Task: Fix 7 isu kritikal P0/P1 dari code review — tanpa ubah konsep (pure improvements)

Work Log:
- Fix 1 (KRITIKAL): billplz.ts verifyWebhook — algoritma Billplz sebenar (x_signature dari form body, sorted key+value join "|", HMAC-SHA256, timing-safe, case-insensitive hex). Sandbox default betul (sandbox melainkan explicit "false").
- Fix 2 (KRITIKAL): lib/admin-auth.ts baru — requireAdmin() fail-closed + timingSafeEqual. Digunakan di admin/stats + orders/[id]/status. Status PATCH kini tulis OrderEvent.
- Fix 3 (KRITIKAL): billplz/create — dev fallback (auto-paid) disekat di produksi kecuali PAYMENTS_ALLOW_DEV_FALLBACK=true; baseUrl tak lagi percayai Origin header di produksi; error upstream tak bocor ke klien; dev fallback tulis OrderEvent.
- Fix 4 (KRITIKAL): ensure-ready.ts — DDL Order penuh (8 kolum payment) + jadual OrderEvent + DDL_MIGRATIONS (PRAGMA table_info check + ALTER TABLE) untuk DB lama.
- Fix 5 (HIGH): orders/[id] GET — ownership check session vs order.sessionId (404 bukan 403), admin key boleh bypass.
- Fix 6 (HIGH): Bug RM25 — orders/route.ts, cart-drawer.tsx, checkout-view.tsx semua import computePricing dari lib/pricing.ts. Threshold >= konsisten dgn UI.
- Fix 7 (HIGH): Stock check atomik — updateMany conditional (stock >= qty) DALAM transaction; kegagalan → rollback penuh + 409.
- Bonus: Admin dashboard UI — skrin ADMIN ACCESS (key gate + sessionStorage), hantar x-admin-key header.
- .env preview: ADMIN_API_KEY=dowgnut-preview-key-2026

Stage Summary:
- 12 fail diubah, lint 0 error 0 warning.
- Ujian lulus semua: RM25 tepat → delivery RM0 (dulu RM3.99); IDOR session salah → 404; admin tanpa/salah key → 401, key betul → 200; webhook signature sah diterima (termasuk uppercase hex), sig salah/tampered amount ditolak; checkout penuh e2e berfungsi (order #CMT66HXV); admin gate UI berfungsi.
- Konsep/brand/vibe TIDAK diubah — semua fix invisible kepada pengguna kecuali skrin admin baru.
