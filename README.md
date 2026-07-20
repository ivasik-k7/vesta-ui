# VESTA UI

**Enterprise web client for VESTA — the living loyalty protocol on Solana.** One application, two first-class journeys: a customer loyalty wallet and a full merchant operations console — every action a real signed devnet transaction, every number read live from the chain.

**Live:** <https://dev-vesta.netlify.app/> · **Ecosystem:** [`vesta-core`](https://github.com/ivasik-k7/vesta-core) (on-chain programs, Rust/Anchor) · [`vesta-sdk`](https://github.com/ivasik-k7/vesta-sdk) (Python, backend integrators)

---

## Table of contents

- [Product surface](#product-surface)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Quality & CI](#quality--ci)
- [Deployment](#deployment)
- [Performance & resilience](#performance--resilience)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [Maintainer](#maintainer)

---

## Product surface

### Customer journey
| Page | Capability |
|---|---|
| **Dashboard** | Network pulse KPIs, live-cooling portfolio, your business summary, quick actions, recent activity |
| **Wallet** | Multi-token portfolio with real-time decay, per-token manage/share, alliance swaps |
| **Token** (`/app/token/:mint`) | Live balance & health, token economics, your loyalty standing, gift & redeem |
| **Discover** | Full merchant directory built for thousands of entries — filters, sort, lazy windowed rendering |
| **Merchant profile** (`/app/merchant/:address`) | Public program view: stats, live offers (claim inline), campaigns |
| **Transactions** | Wallet-scoped history with lazy paging, instruction-level decoding, search/filter/grouping, analysis KPIs |

### Merchant journey (one route per section)
`Overview · Issue points · Offers · Achievements · Campaigns · Alliance · Token & guard · Attestations · Advanced · Analytics`

Covers **every instruction** the programs expose to a merchant: issuing (cap-aware), offer/achievement/campaign CRUD with budgets and quest kinds, alliance membership *and* governance (fees, rate bounds, pause), the full argus policy editor (velocity caps, cooldowns, flags), token metadata & custom attributes, operators, reason-coded clawback with self-imposed caps, and the irreversible actions in a fenced danger zone.

### Platform
- **Auth:** Sign-In-With-Solana (SIWS) sessions per address; guided connect → sign flows; route guards (`/` and `/auth` redirect authenticated users into the app; `/app` requires a session).
- **Account hub:** header avatar menu with chain-derived role badges (Customer / Merchant / Issuer / Admin), quick preferences, and a settings overlay (Profile, Wallets with aliases & guided switching, Funds, Preferences, Admin with protocol controls + merchant verification registry).
- **Notifications:** theme-matched toast system + persistent notification center with unread tracking.
- **Privacy modes:** hide balances / rounded figures applied app-wide.
- **i18n:** 8 locales (en, uk, de, es, fr, pl, ru, zh).

## Architecture

```
routes (TanStack Router, file-based)
   │
components/app (design kit: Section, Group, ActionPanel, TokenCard, …)
   │
lib/vesta ──── queries.ts   TanStack Query hooks (batched, resilient, paged)
          ├─── ixns.ts      hand-rolled instruction builders (Anchor discriminators)
          ├─── decode.ts    zero-dependency borsh account decoders
          ├─── decoder.ts   transaction decoder (all 3 programs, categorized)
          └─── pda.ts       canonical PDA derivations (core / argus / aegis)
```

No generated Anchor client and no backend: the app speaks to the chain through a **thin, auditable TypeScript layer** — instruction builders compute `sha256("global:<name>")` discriminators and borsh-encode arguments; account decoders mirror the on-chain layouts byte-for-byte.

## Technology stack

| Concern | Choice |
|---|---|
| Core | Vite · React 19 · TypeScript (strict) · pnpm |
| Routing / data | TanStack Router (file-based, type-safe) · TanStack Query (incl. infinite queries) |
| Solana | `@solana/web3.js` · `@solana/spl-token` (Token-2022) · wallet-standard auto-discovery |
| UI | Tailwind CSS v4 · shadcn/ui primitives · lucide-react · custom flame design system |
| Env | `@t3-oss/env-core` + Zod (`src/env.ts`) |
| Quality | Biome (lint + format) · Husky + lint-staged · Vitest + RTL |

## Getting started

```bash
pnpm install
cp .env.example .env.local        # set VITE_RPC_URL to a private devnet RPC
pnpm dev
```

> The public devnet RPC rate-limits `getProgramAccounts`, which the app leans on. A private endpoint (e.g. Helius) is effectively required for a smooth experience; it can also be set at runtime in **Account → Wallet & funds → Network/RPC**.

Common tasks:

```bash
pnpm dev            # local dev server
pnpm typecheck      # tsc -b --noEmit
pnpm lint           # biome check
pnpm test           # vitest + RTL
pnpm build          # tsc -b && vite build (regenerates routeTree.gen.ts)
```

## Configuration

All variables are validated at boot (`src/env.ts`); defaults target the live devnet deployment.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_RPC_URL` | public devnet | Solana RPC endpoint |
| `VITE_VESTA_CORE_PROGRAM_ID` | `gaMq6BpH…RG6L4LDz` | protocol program |
| `VITE_ARGUS_PROGRAM_ID` | `9zJEWrk4…Czsz3rx` | transfer-hook engine |
| `VITE_AEGIS_PROGRAM_ID` | `AcCdMQC1…Thsu15e1` | attestation registry |

## Project structure

```
src/
  routes/                    # file-based pages (routeTree.gen.ts is generated)
    app.*.tsx                # authenticated app (dashboard, wallet, console/…)
    index.tsx / auth.tsx     # landing + auth wall (both guard-redirect)
  components/
    app/                     # design kit + app components
      section.tsx            #   Section / SectionMeta / EmptySlate
      settings-kit.tsx       #   Group / Row / DataRow / FieldRow / Switch / Input
      action-panel.tsx       #   standardized signable-action card + fields
      auth-flow.tsx          #   driven connect→sign login & wallet switching
      account-overlay.tsx    #   settings overlay (profile/wallets/funds/prefs/admin)
      notification-bell.tsx / toaster.tsx / share-button.tsx / …
    wallet/ | layout/ | landing/ | ui/
  lib/
    vesta/                   # chain layer (queries, ixns, decoders, PDAs)
    auth/                    # SIWS session management
    notify/ | settings/ | wallet/ | i18n/
  polyfills.ts               # Buffer/global shims — first import of main.tsx
```

## Design system

A single visual language across both journeys:

- **Surfaces:** glassy cards (`bg-card/50`, inset ring, soft shadow, backdrop blur) with flame-accent header bars and gradient dividers.
- **Primitives:** `Section` (uniform page sections), `Group`/`Row`/`DataRow`/`FieldRow` (settings-kit), `ActionPanel` (every signable action: header → fields → CTA footer, equal heights in grids), `Metric` (KPI tiles), `TokenCard`, `EmptySlate`.
- **Typography rules:** mono uppercase micro-labels for metadata, tabular numerals for every figure.
- **Theme:** dark-first warm near-blacks + sicilian flame accent; light theme supported; custom flame-tinted scrollbars.

## Quality & CI

- TypeScript **strict** everywhere; `pnpm typecheck`, `pnpm lint`, and `pnpm build` are the merge gate.
- Husky + lint-staged run Biome with autofix on every commit.
- Toasted, humanized error surface for all RPC/wallet failures (no raw `0x…` dumps to users).

## Deployment

Netlify ([netlify.toml](netlify.toml)): `pnpm build` → `dist`, SPA redirects, security headers (CSP, nosniff, frame-ancestors), immutable caching for hashed assets. Pushes to `main` deploy automatically; `packageManager` pins pnpm via corepack.

## Performance & resilience

- **Query layer:** capped exponential backoff on transient RPC failures (never on hard 4xx), no focus refetch, tuned stale/GC times.
- **Batching:** portfolio loads via two `getMultipleAccountsInfo` round-trips instead of 2×N calls; account lists decode fault-tolerantly (one malformed account never blanks a list).
- **Paging:** transaction history streams in 20-tx pages with an intersection-observer sentinel and a bounded in-memory window (`maxPages`); Discover renders a lazily growing window over the full merchant set.
- **Explicit failure states:** every feed distinguishes empty vs errored, with retry.

## Security notes

- Keys never leave the wallet: the app builds instructions, wallets sign. SIWS messages are verified client-side per address; sessions are address-bound and expire.
- Wallet switching clears the entire query cache before connecting the next wallet — no cross-account data bleed.
- CSP and frame-ancestors are enforced at the edge (see `netlify.toml`).

## Known limitations

- No indexer: activity/analytics operate over RPC windows; protocol-scale analytics is on the roadmap (Helius webhooks / DAS).
- The console manages merchant `id 0`; multi-merchant selection is on-chain-ready but not yet surfaced.
- Offer redemption uses receipt index 0 (repeat redemption of the same offer by one wallet pends a counter).
- New screens are English-first; locale files await a translation pass.

## Maintainer

Built and maintained by [**ivasik-k7**](https://github.com/ivasik-k7). Security contact: `kovtun.ivan@proton.me`.
