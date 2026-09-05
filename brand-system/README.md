---
title: "DOHNUT Brand System — Single Source of Truth"
document_id: "SMS-DOHNUT-BRAND-INDEX-001"
version: "1.2.0"
last_updated: "2026-09-05 09:30:00"
maintainer: "Antigravity / Sovereign Architect"
classification: "Internal / Brand Standards"
lifecycle_status: "Active / Living Standard"
---

# DOHNUT Brand System — Single Source of Truth

> **DOHNUT bukan sekadar brand donut. Ia adalah Malaysian-born, digital-first, playful food brand dengan bahasa, karakter, pop-culture universe dan AI creative system tersendiri.**

Versi: v1.2.0 (segerak dengan pembaharuan visual rasmi & promosi produk)  
Tarikh: 2026-09-05  
Status: ACTIVE / v1.2  

---

## Struktur Sistem

```text
DOHNUT BRAND
    ↓
BRAND GUIDELINES (01-brand-truth.md)
    ↓
POP CULTURE PLAYBOOK (02-06)
    ↓
VISUAL AI ENGINE (06-visual-ai-engine.md + 09-master-image-prompts.md)
    ↓
AI DOCUMENTATION / OPERATING SYSTEM (07-08)
```

## Indeks Dokumen

| Fail | Kandungan | Layer |
|---|---|---|
| [01-brand-truth.md](./01-brand-truth.md) | Identiti asas, positioning, tagline, personality, visual identity | Brand |
| [02-doh-language.md](./02-doh-language.md) | DOH LANGUAGE™ — verbal identity system (EN + MY) | Language |
| [03-doh-boy.md](./03-doh-boy.md) | DOH BOY™ — character canon & social personality | Character |
| [04-doh-cinema-dohflix.md](./04-doh-cinema-dohflix.md) | DOH CINEMA™ + DOHFLIX™ — movie parody universe | Storytelling |
| [05-pop-culture-playbook.md](./05-pop-culture-playbook.md) | Playbook v1.0 — campaigns, formats, guardrails | Content Library |
| [06-visual-ai-engine.md](./06-visual-ai-engine.md) | Visual AI Engine v1.0.0 — Creative Genome, Master Prompt, Visual QA | Production Engine |
| [07-ai-documentation-system.md](./07-ai-documentation-system.md) | Prompts, Skills, Markdown standard, Governance | AI Operating System |
| [08-architecture-roadmap.md](./08-architecture-roadmap.md) | System map penuh, cabaran, fasa seterusnya | Operating System |
| [09-master-image-prompts.md](./09-master-image-prompts.md) | Master Image Generation Prompts (Sira Series & Specialty) | Prompt Registry |

---

## Integrasi Live Dalam App (web)

| Elemen | Lokasi App | Sumber Data |
|---|---|---|
| Tagline **GOOD VIBE. GOOD DOH.** | Splash screen + footer | 01-brand-truth.md |
| **DOH BOY™** persona | AI Concierge chat (backend prompt + header) | 03-doh-boy.md |
| **DOH LANGUAGE™** | Concierge replies, empty states, toasts | 02-doh-language.md |
| **Visual DNA** (kuning/merah/navy, tactile) | AI Designer stylePrefix | 06-visual-ai-engine.md |

Data mesin boleh dibaca: `src/lib/doh-language.ts` (dictionary DOH yang digunakan oleh backend AI).

---

## Peraturan Emas

1. **Konsep app tidak berubah** — brand system di-layer atas struktur sedia ada.
2. Semua copy baharu merujuk dokumen ini sebagai single source of truth.
3. Parody mesti lulus IP safety guardrails (05-pop-culture-playbook.md).
4. Visual mesti lulus 3 soalan QA: **CAN I TASTE IT? CAN I FEEL IT? CAN I RECOGNIZE IT?**

## 📋 Audit & Revision Ledger (SMS-v1.0)
| Version | Timestamp (MYT) | Author | Why (Intent / Trigger) | How (Modifications & Touched Areas) | Validation Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.2.0` | 2026-09-05 09:30:00 | Sovereign Conductor | Alignment semua dokumen (.md) | Tambah SMS-v1.0 frontmatter & ledger; indekskan 09-master-image-prompts.md | File verified |
| `1.0.0` | 2026-08-31 16:00:00 | Hermes Agent | Inisialisasi sistem jenama | Cipta indeks 01-08 dokumen jenama DOHNUT | Baseline documentation |
