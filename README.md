# VESTA UI

Web client for **VESTA** — a living loyalty protocol on Solana where points decay like an untended flame unless customers stay engaged.

> Part of the VESTA ecosystem: [`vesta-core`](https://github.com/ivasik-k7/vesta-core) (on-chain, Rust/Anchor) · [`vesta-sdk`](https://github.com/ivasik-k7/vesta-sdk) (Python client for integrators) · `vesta-ui` (this repo).

Two faces, one app:

- **Customer PWA** — loyalty wallet across merchants with live decay animation, QR earn flow, streak calendar, soulbound badge showcase, alliance point swaps, redemption market.
- **Merchant dashboard** — 2-minute onboarding (mint created behind the scenes), POS QR generation, campaigns, offers, alliance management.

On-chain calls go through a thin TypeScript client generated from the Anchor IDL (lives in this repo; the Python SDK targets backend integrators, browsers need TS).

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · shadcn/ui · `@solana/wallet-adapter` · TanStack Query · Zustand

## Development

```bash
npm install
npm run dev       # local dev server
npm run lint && npm run build
```

## Status

Phase 0 scaffold. Screens land in phase 5 (parallel with on-chain phases 1–4); public deployment link will be added here.
