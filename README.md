# VESTA UI

Web client for **VESTA** — a living loyalty protocol on Solana where points decay like an untended flame unless customers stay engaged.

> Part of the VESTA ecosystem: [`vesta-core`](https://github.com/ivasik-k7/vesta-core) (on-chain, Rust/Anchor) · [`vesta-sdk`](https://github.com/ivasik-k7/vesta-sdk) (Python client for integrators) · `vesta-ui` (this repo).

Two faces, one app:

- **Customer PWA** — loyalty wallet across merchants with live decay animation, QR earn flow, streak calendar, soulbound badge showcase, alliance point swaps, redemption market.
- **Merchant dashboard** — 2-minute onboarding (mint created behind the scenes), POS QR generation, campaigns, offers, alliance management.

On-chain calls go through a thin TypeScript client generated from the Anchor IDL (lives in this repo; the Python SDK targets backend integrators, browsers need TS).

## Stack

- **Core**: Vite (`@vitejs/plugin-react-swc`) · React 19 · TypeScript (strict) · pnpm
- **UI**: Tailwind CSS v4 · shadcn/ui (radix, nova preset) · lucide-react · `cn` helper (clsx + tailwind-merge)
- **Routing/State**: TanStack Router (file-based, type-safe) · TanStack Query
- **Forms**: React Hook Form · Zod · @hookform/resolvers
- **Quality**: Biome (lint + format, one fast tool) · Husky + lint-staged · Vitest + React Testing Library
- **Env**: typed and validated via `@t3-oss/env-core` + Zod (`src/env.ts`, see `.env.example`)

Path alias `@/` → `src/`. Routes live in `src/routes/` (`routeTree.gen.ts` is generated — committed, excluded from lint).

## Development

```bash
pnpm install
pnpm dev          # local dev server
pnpm lint         # biome check
pnpm typecheck    # tsc -b
pnpm test         # vitest + RTL
pnpm build        # production build
```

Husky runs `lint-staged` (Biome with autofix) on every commit.

## Deployment

Deployed on **Netlify** — config lives in [netlify.toml](netlify.toml): `pnpm build` → `dist`, SPA redirects for client-side routing, security headers (CSP, nosniff, frame-ancestors), immutable caching for hashed assets. Connect the GitHub repo in Netlify and every push to `main` ships automatically; `packageManager` in package.json pins pnpm via corepack.

## Status

Landing page live; customer app and merchant dashboard land in phase 5 (parallel with on-chain phases 1–4). Public deployment link will be added here.
