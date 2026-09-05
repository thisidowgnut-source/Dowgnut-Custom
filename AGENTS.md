---
title: "DOH-NUT Repository Guidelines"
document_id: "SMS-DOHNUT-AGENTS-001"
version: "1.2.0"
last_updated: "2026-09-05 09:30:00"
maintainer: "Antigravity / Sovereign Architect"
classification: "Internal / Developer Guidelines"
lifecycle_status: "Active / Living Standard"
---

# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router storefront written in TypeScript. Pages, layouts, and route handlers live in `src/app`; API endpoints are under `src/app/api`. Product components belong in `src/components/dohnut`, reusable shadcn/Radix primitives in `src/components/ui`, shared logic in `src/lib`, and client state in `src/store`. Prisma schema and seed data (curating **31 unique donut flavors**) live in `prisma/` and `src/lib/seed-data.ts`. Static assets and the service worker belong in `public/`. Deployment helper tests are Bash scripts under `tests/`; `mini-services/order-tracking` is a separate Bun service. Treat `research/`, `brand-system/`, and `examples/` as supporting material.

## Build, Test, and Development Commands

- `bun install` installs dependencies from `bun.lock`.
- `bun run dev` starts Next.js on `http://localhost:3000`.
- `bun run lint` runs the Next.js ESLint configuration across the repository.
- `bun run build` creates the standalone production build and copies required static assets.
- `bun run db:generate` regenerates Prisma Client after schema changes.
- `bun run db:migrate` creates and applies a local development migration.
- `bash tests/database-runtime-build.sh` runs a deployment-script integration test. Run the other `tests/*.sh` similarly; the container test also requires Docker.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, and TypeScript types at module boundaries. Prefer the `@/` alias over long relative imports. Name React components and exported types in PascalCase, functions and hooks in camelCase (`useShop`), and files/routes in kebab-case. Keep route handlers thin and move reusable validation, pricing, authentication, and database logic into `src/lib`. Run `bun run lint` before submitting; no Prettier configuration is committed.

## Testing Guidelines

No JavaScript unit-test runner or coverage gate is currently configured. For every change, lint and build locally, then exercise the affected UI or API flow. Add regression tests beside the existing Bash integration tests when changing `.zscripts`; name them after the behavior, such as `database-runtime-build.sh`.

## Commit & Pull Request Guidelines

Recent descriptive commits use Conventional Commits, for example `fix(build): guard standalone asset copy`. Prefer `feat:`, `fix:`, `test:`, `docs:`, or `chore:` with an optional scope. Keep commits atomic. Pull requests should explain intent and risk, link related issues, list verification commands, note schema or environment changes, and include screenshots or recordings for visible UI changes.

## Security & Configuration

Copy `.env.example` to `.env.local`; never commit credentials or database files. Validate all request input, preserve session scoping, and require `ADMIN_API_KEY` for privileged production routes. Treat payment webhook or Billplz changes as security-sensitive and test signatures and failure paths.

## 📋 Audit & Revision Ledger (SMS-v1.0)
| Version | Timestamp (MYT) | Author | Why (Intent / Trigger) | How (Modifications & Touched Areas) | Validation Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.2.0` | 2026-09-05 09:30:00 | Sovereign Conductor | Alignment dokumen projek (.md) | Tambah SMS-v1.0 frontmatter, ledger, dan segerakkan 31 perisa katalog | `bun run build`: 13/13 pages OK |
| `1.0.0` | 2026-08-25 12:00:00 | Core Team | Inisialisasi garis panduan repositori | Asas panduan kod, struktur modul, dan sekuriti | Baseline approval |
