---
title: "DOH-NUT Project Rules & Episodic Memory"
document_id: "SMS-DOHNUT-GEMINI-001"
version: "1.2.0"
last_updated: "2026-09-05 09:30:00"
maintainer: "Antigravity / Sovereign Architect"
classification: "Internal / Core Rules"
lifecycle_status: "Active / Living Standard"
---

# 🔒 DOH-NUT PROJECT RULES & EPISODIC MEMORY (GEMINI.md)

## 🔒 PERATURAN MUTLAK (Zero Unprompted UI Additions)
1. **DILARANG SAMA SEKALI** menambah komponen UI baharu, butang tambahan, tab bar navigasi ekstra (seperti bar pil kategori), atau mengubah struktur visual asal tanpa arahan dan persetujuan eksplisit daripada pengguna terlebih dahulu.
2. **Skop Pembaikan:** Sebarang pembaikan pepijat (*bugfix*) atau logik fungsi hanya membetulkan isu teknikal yang diminta tanpa mengubah estetika visual asal atau menyuntik komponen yang tidak diminta.
3. **Kekalkan Standard Asal:** Reka bentuk asal Flutter / DohNut (3 donat display, 3D ring slider bersih dengan hanya butang Back, background partikel dan warna rasmi) mesti dikekalkan 100%.

## 📝 Episodic Memory & Solved Milestones
- **2026-09-05 (Emil Design & DevTools Optimization)**:
  - Dipasangkan maklum balas sentuhan `active:scale-[0.97]` dan peralihan bersasar pada [button.tsx](file:///g:/Doh-Nut/src/components/ui/button.tsx).
  - Dibetulkan kontras aksesibiliti navigasi bawah kepada 85% untuk melepasi piawaian WCAG AA (>4.5:1).
  - Dioptimumkan LCP melalui keutamaan imej logo dan donat tengah.
  - Dilaksanakan code splitting Recharts pada [admin-charts.tsx](file:///g:/Doh-Nut/src/components/dohnut/admin-charts.tsx) untuk mengurangkan TBT.
  - Disahkan melalui `bun run build`: 13/13 halaman statik & pelayan dijana dengan 0 ralat TypeScript.
- **2026-09-05 (Product Image Audit & Fixes)**:
  - Dijana 3 aset imej Sira Series yang hilang: `kuih-burger-malaysia.png`, `sira-kuih-keria.png`, `sira-sambal.png` (resolusi standard 1024x1024).
  - Dilakukan batch resize 12 fail imej gergasi (2048x2048, ~12MB total) kepada 1024x1024 bicubic interpolation untuk menjimatkan ~2.5MB payload mobile.
  - Disahkan 31/31 rujukan `seed-data.ts` wujud tanpa sebarang fail hilang (0 missing). Server merespons HTTP 200 OK.
- **2026-09-05 (3D Slider Motion Stabilization)**:
  - Dihapuskan ayunan condong liar `tiltZ` (rotateZ mengikut halaju) pada ring 3D [donut-slider.tsx](file:///g:/Doh-Nut/src/components/dohnut/donut-slider.tsx) agar satah putaran kekal tegap dan stabil.
  - Dibuang denyutan melompat `scale: [1, 1.05, 1]` pada donat tengah agar visual tidak terkejut-kejut semasa sliding.
  - Ditala spring snap kepada *critically damped* (`stiffness: 320, damping: 32`) bagi menghapuskan lantunan berlebihan (*zero overshoot*).
  - Dilaraskan rintangan leretan kepada `150px` agar kawalan jari terasa padu dan konsisten.
- **2026-09-05 (Universal Markdown Alignment & SMS-v1.0 Compliance)**:
  - Selaraskan semua dokumentasi (.md) agar konsisten dengan realiti sistem terkini: 31 perisa katalog unik, palet rasmi (Kuning/Merah/Navy/Butter), dan status pembetulan sistem.
- **2026-09-05 (Vercel Serverless SQLite Fallback Fix & Deployment Ready)**:
  - Dibetulkan ralat build Vercel `Production requires a persistent DATABASE_URL; refusing local SQLite fallback` pada [sqlite-path.ts](file:///g:/Doh-Nut/src/lib/sqlite-path.ts).
  - Ditambah laluan fallback selamat `file:/tmp/dowgnut.db` khusus persekitaran Vercel serverless tanpa persediaan DB luaran (Option A demo deploy).
  - Diuji dan diluluskan 45/45 ujian unit `bun test` dan binaan Next.js 13/13 halaman statik & pelayan.
  - Berjaya dideploy ke Vercel production: status `● Ready` dalam 47 saat.

## 📋 Audit & Revision Ledger (SMS-v1.0)
| Version | Timestamp (MYT) | Author | Why (Intent / Trigger) | How (Modifications & Touched Areas) | Validation Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.3.0` | 2026-09-05 10:28:00 | Sovereign Conductor | Vercel build failure bugfix | Baiki `resolveDatabaseUrl` untuk /tmp fallback di Vercel & update tests | Vercel build: `● Ready` (47s), 45/45 tests pass |
| `1.2.0` | 2026-09-05 09:30:00 | Sovereign Conductor | Alignment semua dokumen projek (.md) | Tambah SMS-v1.0 frontmatter & ledger, kemaskini milestone universal | `bun run build`: 13/13 pages OK |
| `1.1.0` | 2026-09-05 05:25:00 | Sovereign Conductor | Penstabilan fizik 3D slider | Buang `tiltZ`, matikan pulse scale, tune spring critically damped | Manual slider drag test |
| `1.0.0` | 2026-09-05 04:55:00 | Sovereign Conductor | Audit imej produk & Emil design | Resize 12 imej 2048→1024, jana 3 imej Sira Series | 31/31 rujukan sah (HTTP 200) |
