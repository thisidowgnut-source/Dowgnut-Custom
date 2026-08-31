# DOHNUT Brand System — Single Source of Truth

> **DOHNUT bukan sekadar brand donut. Ia adalah Malaysian-born, digital-first, playful food brand dengan bahasa, karakter, pop-culture universe dan AI creative system tersendiri.**

Versi: v1.0.0 (merged dari perbualan brand development)
Tarikh merge: 2026-08-31
Status: FOUNDATION / v1.0

---

## Struktur Sistem

```text
DOHNUT BRAND
    ↓
BRAND GUIDELINES (01-brand-truth.md)
    ↓
POP CULTURE PLAYBOOK (02-06)
    ↓
VISUAL AI ENGINE (06-visual-ai-engine.md)
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
