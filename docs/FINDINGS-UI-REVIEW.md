# VESTA UI — Post-Rework Review & Findings

> Review of the app after the navigation + journeys rework (workspace switcher, action registry, ⌘K palette, warm-paper light theme, customer pages, issuer/admin workspaces).
> Lens: **UI gaps · standardization · MPA structure · on-chain action coverage · rich functionality.**
> Each finding has a **priority** (P1 highest) and a **status**: `covered` (fixed in this pass), `partial`, or `open` (roadmap).

---

## A. On-chain action coverage

The single biggest gap. The Action Registry + nav now expose every capability that has a **client instruction builder**. But many program instructions have **no client builder yet** (`ixns.ts`), so they cannot be surfaced without first writing — and carefully verifying — their account layouts against the program `Context` structs. Surfacing them with guessed metas would fail on-chain, so they are deliberately deferred, not faked.

### Covered today (has builder + surface)
`register_merchant, update_merchant, close_merchant, finalize_transfer_guard, set_token_attribute, update_token_metadata, update_decay_rate, set_merchant_operator, set_merchant_paused, update_merchant_profile, set_clawback_cap, earn_points, earn_points_campaign, create_offer, close_offer, create_campaign, update_campaign, close_campaign, create_achievement, close_achievement, grant_achievement, clawback, initialize_transfer_guard, configure_policy, set_guard_paused, create_alliance, join_alliance, leave_alliance, set_alliance_params, set_alliance_paused, set_swap_rate, set_swap_budget, swap_points, redeem_offer, refresh_customer_eligibility (customer boost), init_issuer, issue_attestation, revoke_attestation, set_paused, verify_merchant, set_admin.`

### P1 — Merchant instructions with NO client builder yet (`open`)
Grouped by the dedicated page they should live on (pages to add under `/app/console/*`):

- **Customers / Segments** (`/app/console/segments`): `set_merchant_segments`, `set_offer_segment` (gate an offer), plus a per-customer `refresh_customer_eligibility` cranker view.
- **Reserves** (`/app/console/reserves`): `open_reserve`, `fund_reserve`, `withdraw_reserve`, `attest_reserve`.
- **Compliance** (`/app/console/compliance`): `set_merchant_trust`, `set_merchant_issue_status`, `anchor_merchant_statement`, `set_daily_issue_cap`, `set_merchant_governance`.
- **Transfer guard, advanced** (extend `/app/console/token` guard section): `add_list_entry`, `remove_list_entry`, `invalidate_capability`, `set_trust_anchor`, `set_degrade_mode`, `bump_screening_epoch`, `purchase_license`, `transfer_guard_authority` / `accept_guard_authority`.
- **Governance** (`/app/console/governance`): `initialize_governance`, `propose_policy`, `approve_policy`, `activate_policy`, `rollback_policy`, `pin_policy`, `propose_role_change`, `apply_role_change`, `anchor_statement`.
- **Alliance (already-built ixns, not yet surfaced):** `update_alliance_profile`, `set_member_active` have builders (`updateAllianceProfileIx`, `setMemberActiveIx`) but no UI — cheap to surface. `transfer_alliance_authority` / `accept_alliance_authority` need builders.

### P1 — Issuer instructions with NO builder yet (`open`)
Beyond `init_issuer / issue_attestation / revoke_attestation`: `set_issuer_paused, set_operator, transfer_issuer_authority, accept_issuer_authority, register_schema, deprecate_schema, update_attestation, erase_attestation (GDPR), close_attestation, register_policy, deprecate_policy, register_trust_root, accredit_issuer, set_root_active, revoke_accreditation`. Should become the Issuer workspace's `Schemas`, `Attestations`, `Policies`, `Accreditation` pages (per spec §7.1).

### P2 — Admin/protocol instructions with NO builder yet (`open`)
`accept_admin` (the accept side of handover), `migrate_config`, and all argus licensing (`initialize_protocol, set_license_fee, transfer/accept_protocol_authority, withdraw_fees, set_license`). → `/app/admin/licensing`.

### Covered in this pass
- **`set_daily_issue_cap`** — added `setDailyIssueCapIx` (mirrors `set_clawback_cap`, same owner-only Context) and surfaced it in the merchant Team & controls page. `covered`

> **Recommended approach for the rest:** add builders in `ixns.ts` in small batches, each verified against the program's `#[derive(Accounts)]` Context (account order + signer/mut/PDA seeds), with a matching `ActionPanel` surface and a registry entry. The registry + workspace scaffolding already make each addition a localized change.

---

## B. Standardization

- **P2 `covered` — Dashboard quick-actions now render from the registry.** `/app/console` and `/app` featured actions previously hardcoded; the customer dashboard quick-actions were a bespoke `ActionTile` list. Now driven by `featuredActionsFor(kind)` so the registry is the true single source.
- **P2 `partial` — Shared gradient glyph.** The identity gradient was duplicated in 4 files. Extracted to `src/lib/ui/gradient.ts`; the new `workspace-switcher` and `account-menu` now consume it. `auth-flow` and `account-overlay` still hold local copies — migrate them next.
- **P3 `open` — Duplicate `useNow` ticker** in `flame-balance.tsx`, `app.token.$mint.tsx`, `app.wallet.tsx`. Extract to `src/lib/ui/use-now.ts`.
- **P3 `partial` — Decorative status pills.** The user's standing rule is "no decorative badges/status chips." Remaining `rounded-full` pills (`Active`/`Paused`/`Verified`/`In alliance` on the dashboard MerchantSummary and console overview; role chips in the account menu) are *meaningful status*, not ornament — kept, but flagged to re-express as inline icon+text for full consistency with the crypto-tech language. Verified badge is arguably justified; `Active` chip is the weakest and should go inline.
- **P3 `open` — TAB_META vs nav label drift.** Merchant `advanced` tab renders title "Advanced" while the sidebar labels it "Team & controls"; align the copy (retitled in this pass to "Team & controls").
- **P3 `open` — i18n coverage.** New pages/labels are hardcoded English; the registry `label`/`hint` should become i18n keys to match the landing's 8-locale support.

---

## C. MPA structure

- **P2 `partial` — Console is one 1,900-line file.** The console is *routed* per tab (`app.console_.$tab.tsx` → `ConsoleView`), so it behaves as an MPA, but all tab bodies live in one module. As new pages (segments/reserves/compliance/governance) land, split tab bodies into `src/components/app/console/*` modules for maintainability.
- **P3 `open` — Deep-link intents.** Registry entries carry an `intent` (e.g. `gift`, `register`) but pages don't yet read a matching search param to auto-open the relevant `ActionPanel`. Wire `?gift=1` etc. per hosting page so ⌘K / quick-actions can jump straight into an action.
- **`ok` — Route tree is clean.** Customer, shared, issuer, admin, and console tabs are all real, linkable, back-buttonable routes. Workspace↔route sync works both ways.

---

## D. Rich functionality / UX

- **P2 `open` — Workspace dashboards.** Issuer and Admin have functional pages but no "at a glance" dashboard (KPIs + featured actions). Customer and Merchant dashboards should also render their featured actions from the registry (see B).
- **P2 `covered` — Multi-merchant console.** `ConsoleView` now reads `useWorkspace().activeMerchant` (falling back to the primary), and `TabBody` derives the PDA from `merchant.id` instead of a hardcoded `0n`. Switching brands in the workspace switcher now re-scopes the whole console, and non-primary brands resolve to the correct PDA.
- **P3 `open` — Empty/disabled nav teaching.** `NavItem` supports a disabled+reason state; not yet used. Gate advanced actions (e.g. governance) with a teaching tooltip rather than omission where useful.
- **P3 `open` — Command palette recents & intents.** Palette has Actions + Merchants; add Recents and honor `intent` on navigate.
- **`ok` — Responsiveness.** Sidebar ↔ drawer + bottom tab bar across phone/tablet/laptop; main content padded for the mobile tab bar.

---

## E. Light theme (post-pass verification)

- **`ok`** — Warm-paper palette, per-theme brand + `line-strong`, flame-family charts, tokenized elevation (`.shadow-panel`), switch-knob hairlines, fixed dark sidebar-primary.
- **P3 `open` — Landing white-tint decoratives.** Hero/flame-demo use `from-white/[0.05]` glass tints that wash out in light; gate them behind the dark variant or use `foreground/[0.03]`. (App surfaces are clean; this is marketing-only.)
- **P3 `open` — A11y contrast audit.** Spot-checked; run a full WCAG AA pass on both themes (muted-foreground on card, flame-on-paper for small text).

---

## Priority summary

| P | Theme | Item | Status |
|---|---|---|---|
| P1 | Coverage | Merchant segments/reserves/compliance/guard-advanced/governance builders + pages | open |
| P1 | Coverage | Issuer schemas/policies/accreditation/attestation-lifecycle | open |
| P2 | Coverage | Admin licensing + accept-admin | open |
| P2 | Func | Multi-merchant console scoping (activeMerchant) | covered |
| P2 | Standard | Quick-actions from registry | covered |
| P2 | Standard | Shared gradient glyph | covered |
| P2 | Coverage | set_daily_issue_cap | covered |
| P2 | MPA | Split console module | partial |
| P3 | Standard | useNow dedup, status-pill language, i18n, intents | open |
