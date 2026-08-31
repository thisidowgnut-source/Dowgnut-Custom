
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

---
Task ID: image-flavor-audit
Agent: main (Z.ai Code)
Task: Audit semua imej donut vs nama flavor + baiki mismatch (konsep kekal)

Work Log:
- Audit VLM 33 imej dalam public/brand/donuts (setiap imej diterangkan oleh vision model).
- Hash md5 mendedahkan 12 fail "branded" hanyalah 3 imej unik diduplikasi: 6 fail purple sama (matcha/pandan/strawberry-*.png), 3 fail green sama (chocolate-*.png + durian-cream.png), 3 fail brown sama (teh-tarik*.png + kopi-classic.png).
- Gaya tidak konsisten: imej generik = fotorealistik latar putih; imej branded = kartun latar berwarna → tidak boleh diguna terus.
- 13 pembetulan: 9 imej baru DIJANA fotorealistik (toasted-coconut, pandan-gula-melaka, teh-tarik-kaw, matcha-white-choco, blueberry-cheesecake, teh-tarik-foam, ipoh-white-coffee, musang-king-durian, confetti-fiesta) + 4 remap semula imej sedia ada (Cameron Strawberry→classic7 pink, Chocolate Sprinkle Bomb→sprinkled3, Strawberry Funfetti→sprinkled4 pink, Vanilla Bean→sprinkled2).
- VLM verify semula 9 imej baru: semua sepadan (pandan=hijau+drizzle gelap, matcha=hijau+white sprinkles, blueberry=purple+cream-filled, durian=custard kuning meleleh, confetti=rainbow).
- seed-data.ts dikemas kini (13 entri) + DB live dipatch (13 updateMany berjaya).
- Browser verify: semua imej 200 & dimuat tanpa broken image.

Stage Summary:
- 28/28 flavor kini mempunyai imej yang sepadan dari segi warna/topping dengan nama.
- Konsep/nama/flavor/description/harga TIDAK diubah — hanya imgUrl dibetulkan.
- 12 fail branded duplikasi (kartun) kekal di folder tapi tidak digunakan — boleh dipadam kemudian jika mahu.

---
Task ID: logo-theme-rebrand
Agent: main (Z.ai Code)
Task: Ganti logo rasmi baru (Doh-Nut) + re-theme ikut palet logo (konsep kekal)

Work Log:
- Analisa logo rasmi dengan VLM: kuning #FDE047 (bg), merah #EF233C (blob), navy #1D3557 (border/teks), putih. Vibe playful/bubbly.
- Proses logo (sharp): 2048px JPEG 1.5MB → PNG optimized 424KB wordmark + app-icon-512/192 + maskable + apple-touch-icon + favicon-new.png.
- globals.css: token swap (NAMA kekal, nilai baru) — background #fde047 (kuning logo), foreground #1d3557 (navy), primary #ef233c (merah), secondary navy, cream→#fff9db butter, lime→#fde047, pink→#ef233c, dough→#e8c468. Utilities (glass-card, brand-stroke, drip-shadow, lime-bg-grid, scrollbar) dikemas kini. Dark block juga.
- layout.tsx: themeColor #FDE047 + favicon → favicon-new.png.
- manifest.json: theme_color #FDE047, background_color #FFF9DB.
- splash-screen: glow #e8f866→#fde047.
- admin-dashboard: 8 hardcoded hex lama → palet baru.
- Struktur komponen/layout/konsep TIDAK diubah — hanya nilai warna.

Stage Summary:
- Logo baru dipasang di header + splash + semua ikon PWA.
- Tema: kuning-merah-navy dari logo rasmi — VLM verify: "highly consistent and cohesive, no contrast issues".
- Splash VLM verify: logo kuning pop pada navy bg, "clean, professional".
- Contrast: navy #1d3557 pada kuning ≈ 9.9:1 (AAA); putih pada merah #ef233c ≈ 4.6:1 (AA bold).

---
Task ID: logo-theme-verify
Agent: main (Z.ai Code)
Task: Verifikasi akhir pasca rebrand logo + tema (sambungan sesi terpotong)

Work Log:
- Semak keadaan: dev server hidup, semua API 200, tiada error runtime.
- Bersih warning lint terakhir (unused eslint-disable di error-boundary.tsx) → 0 error 0 warning.
- Agent Browser e2e: page load penuh, tiada console/page error.
- DOM verify: dowgnut-logo-wordmark.png (1024px, alt "DowgNut logo") loaded di header, semua imej donut ok.
- VLM verify logo asal upload: "Doh-Nut" — huruf putih ber-outline navy, blob merah, border putih+dalam biru, latar kuning, TM di atas kanan.
- Ujian interaktif: klik kategori Classic ✓, Add to Cart ✓ (toast + badge), cart drawer ✓, harga RM7.70 (RM3.50 + RM3.70 delivery bawah threshold RM25) ✓.
- Cart ujian dibersihkan selepas uji.
- Skrip verify sementara dipadam.

Stage Summary:
- Logo rasmi Doh-Nut + tema kuning (#FDE047) / merah (#EF233C) / navy (#1D3557) / butter (#FFF9DB) TERPASANG dan TERBUKTI berfungsi e2e.
- Konsep app, struktur komponen, 32 flavor, AI Concierge, gamification — semua kekal tak berubah.
- Nota VLM: font bubbly wordmark kadang tersalah baca oleh vision model (Krispy Kreme/Play-Doh) — DOM + analisa logo asal mengesahkan ia wordmark Doh-Nut dari fail upload pengguna.
