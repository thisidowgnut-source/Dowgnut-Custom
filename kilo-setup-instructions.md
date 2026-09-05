---
title: "Kilo Code Extension Verification Steps"
document_id: "SMS-DOHNUT-KILO-001"
version: "1.1.0"
last_updated: "2026-09-05 09:30:00"
maintainer: "Antigravity / Sovereign Architect"
classification: "Internal / Tooling Guide"
lifecycle_status: "Active / Living Standard"
---

# Kilo Code Extension Verification Steps

Run this in VS Code Terminal (Ctrl+`):

```bash
# 1. Check if Kilo Code is loaded
code --list-extensions | grep kilo

# 2. Check Kilo Output panel
# View → Output → Select "Kilo Code" from dropdown

# 3. Test authentication in VS Code Command Palette (Ctrl+Shift+P)
# Type: "Kilo Code: Sign In" or "Kilo Code: Use your own API key"

# 4. Check Kilo status
# Ctrl+Shift+P → "Kilo Code: Show Status"
```

If Kilo Code not authenticated:
1. Ctrl+Shift+P → "Kilo Code: Use your own API key"
2. Choose Provider: OpenRouter
3. Paste key: `sk-or-v1-YOUR_OPENROUTER_API_KEY_HERE`
4. Reload window: Ctrl+Shift+P → "Developer: Reload Window"

## Alternative — Direct config
The `C:\Users\megat\.kilo\config.json` is already configured with live providers.

## 📋 Audit & Revision Ledger (SMS-v1.0)
| Version | Timestamp (MYT) | Author | Why (Intent / Trigger) | How (Modifications & Touched Areas) | Validation Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.1.0` | 2026-09-05 09:30:00 | Sovereign Conductor | Alignment semua dokumen (.md) & sanitasi | Tambah SMS-v1.0 frontmatter & ledger; sanitasi OpenRouter key | Verified no raw secrets |
| `1.0.0` | 2026-08-28 14:00:00 | Operator | Langkah pengesahan Kilo Code | Dokumentasi langkah setup Kilo Code | Manual VS Code verify |
