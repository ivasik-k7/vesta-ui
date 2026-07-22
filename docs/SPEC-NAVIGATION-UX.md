# VESTA — Navigation & Journeys UX Specification

> Status: **DRAFT for approval** · Target: v2.2 (UI) · Scope: in-app navigation (`/app/*`), Customer & Merchant journeys, standardized nav component system, light theme.
> This spec is authored against the **live v2.1.0 devnet deployment** and the real on-chain instruction surface of `vesta-core`, `argus`, and `aegis`. Every navigation destination and action below maps to a real capability — nothing aspirational.

---

## 0. Why this rework

The app today is capable but the navigation under-sells it:

- **The sidebar is a flat list.** Customer nav is 4 links; merchant nav is 10 links (9 console tabs + analytics) with no grouping — a wall of equal-weight items. There is no sense of _journey_ or _priority_.
- **Capability is hidden or duplicated.** `/app/alliances` has no nav entry. Issuer lives buried in a console tab. Admin lives inside the account overlay. A user cannot see "what can I actually do here?" in one place.
- **Role model is binary.** A `customer`/`merchant` mode toggle only appears for merchants; Issuer and Admin have no home. A wallet can own **many** merchants (`Merchant` is keyed by `(authority, id)`) but the UI only ever addresses `id = 0`.
- **No fast path.** No search, no command palette, no "jump to action." On a crypto-tech platform this is table stakes.
- **Light theme is unusable.** Tokens exist but `--color-line-strong` is a dark grey applied globally, the flame scale is single-valued, charts are greyscale, and shadows/switch-knobs are hardcoded for dark.

The goal: a **Solflare-grade** experience — a persistent, grouped, role-aware sidebar with a **workspace switcher** at the top, a **command palette** for power users, a **single action registry** that guarantees "everything you can do is discoverable," and two first-class, gamified **journeys** (Customer & Merchant) that make decisions obvious. Plus a genuinely premium **light theme**.

---

## 1. Principles

1. **One source of truth for actions.** Every on-chain action a role can take is declared once in an **Action Registry**. The sidebar, command palette, dashboard quick-actions, and empty-state CTAs all render from it. Adding an action = one registry entry, surfaced everywhere.
2. **Journeys, not menus.** Navigation is organized around what the user is _trying to accomplish_ (earn → hold → grow → spend → prove), not around program modules.
3. **Role-aware, never mysterious.** We reveal capability progressively (a customer who isn't a merchant sees a "Launch a program" invitation, not a locked merchant console). But we never _hide_ what a role can do — an authenticated merchant sees the full merchant surface, grouped.
4. **MPA by default.** Every meaningful surface is a real, linkable, back-buttonable route. Deep-linking a specific action (`/app/console/offers?new=1`) is always possible.
5. **Standardized components only.** No bespoke nav markup. Every nav element is one of a small set of documented primitives (§4). Consistency is the product.
6. **Decisions first.** Each page leads with the decisions a user can make here (primary actions), then supporting data. No page is a dead-end read-only wall unless it is explicitly an explorer.
7. **Crypto-tech restraint.** Mono labels, flame accent, terminal panels, purposeful motion. **No decorative badges, status chips, or pills** as ornament (status is communicated with icon + color + text, inline).

---

## 2. Information architecture

### 2.1 The four roles (derived live from chain)

| Role | Detected by | Nature |
|---|---|---|
| **Customer** | always (any connected wallet) | Baseline. Everyone is a customer. |
| **Merchant** | a `Merchant` PDA exists for `(wallet, id)` — potentially several | Runs one or more loyalty programs. |
| **Issuer** | an aegis `Issuer` account exists for the wallet | Attests credentials; may be an accreditor (trust root). |
| **Admin** | `vesta_core Config.admin == wallet` (and/or `argus ArgusProtocol.authority`) | Protocol governance & licensing. |

### 2.2 Workspaces (the top-level navigation model)

The sidebar is anchored by a **Workspace Switcher** (Solflare's account-switcher pattern, repurposed). A _workspace_ is a role context. The switcher lists exactly the workspaces the wallet qualifies for:

```
◆ Customer                     ← always present
◆ Merchant · «Brand A»         ← one row per Merchant PDA the wallet owns
◆ Merchant · «Brand B»
◆ Issuer · «Kleos Labs»        ← if an aegis Issuer exists
◆ Admin                        ← if protocol admin
```

- Selecting a workspace swaps the sidebar's grouped destinations and routes to that workspace's home.
- The switcher shows the active workspace's identity (brand glyph + name + role word). Collapsed, it's a single tappable row; expanded, a dropdown of all contexts + a "Launch a new program" / "Become an issuer" affordance.
- **Multi-merchant is a first-class feature** (a "winning" differentiator): a wallet that owns several brands switches between them here; the selected merchant id is held in a `WorkspaceContext` and threads through every `/app/console/*` query.
- Customer and the selected Merchant are the two _primary_ journeys; Issuer and Admin are _advanced_ workspaces that simply don't appear unless earned.

> **Decision (recommended):** replace the current binary `customer|merchant` mode toggle with this workspace switcher. Rationale: it scales to Issuer/Admin and multi-merchant, matches Solflare's mental model, and gives each role a real identity. _Alternative kept on the table:_ keep a 2-up segmented toggle and nest Issuer/Admin under a "More" group — simpler, but caps the ceiling.

### 2.3 Sidebar anatomy (all workspaces)

```
┌──────────────────────────┐
│  VESTA  ▸  logo           │  brand rail
├──────────────────────────┤
│  ◆ Workspace switcher     │  §2.2
├──────────────────────────┤
│  GROUP LABEL              │  §4.2 SidebarGroup (mono, tracked, muted)
│   ▸ Nav item      ·count  │  §4.3 NavItem (icon, label, active bar, trailing meta)
│   ▸ Nav item              │
│                           │
│  GROUP LABEL              │
│   ▸ Nav item              │
│  …                        │
├──────────────────────────┤
│  Protocol · Network·Verify│  shared utility group (all workspaces)
├──────────────────────────┤
│  ● Devnet   ⌘K   ⚙  ⏻     │  SidebarFooter: net status, palette, settings, sign out
└──────────────────────────┘
```

Mobile: the sidebar becomes a drawer (hamburger), plus a **bottom tab bar** exposing the current workspace's top 4–5 destinations for thumb reach (Solflare-style).

---

## 3. The Action Registry (architectural backbone)

A single typed catalog — `src/lib/nav/actions.ts` — declares every action. This is the literal answer to _"I need a full list of possible actions I can perform as merchant or as customer."_

```ts
type Role = 'customer' | 'merchant' | 'issuer' | 'admin' | 'crank'

interface AppAction {
  id: string                     // 'offer.redeem'
  role: Role                     // primary role that performs it
  label: string                  // 'Redeem an offer'
  hint?: string                  // one-line description
  icon: Icon
  route: string                  // destination that hosts the action
  intent?: string                // query/param that opens the action panel directly
  group: string                  // sidebar/journey group
  instruction?: string           // on-chain ix it maps to (traceability)
  gating?: 'segment' | 'accreditation' | 'license' | 'governance' | 'owner-only' | 'operator'
  requires?: (ctx) => boolean    // extra runtime predicate (e.g. holds a token)
}
```

Everything renders from it:
- **Sidebar** = registry grouped by `group`, filtered by active workspace `role`.
- **Command palette (⌘K)** = full registry, fuzzy-searchable, role-scoped first.
- **Dashboard quick actions** = the `featured` subset per role.
- **Empty-state CTAs** = the registry entry whose `id` the empty state references (no ad-hoc buttons).
- **Traceability** = each entry names its `instruction`, so the spec, the UI, and the program stay in lock-step (this table _is_ §5/§6 below).

---

## 4. Standardized navigation components

All live in `src/components/app/nav/` and are the **only** way to build navigation. Each has documented props and states.

### 4.1 `WorkspaceSwitcher`
- **Props:** `workspaces: Workspace[]`, `active: WorkspaceId`, `onSelect`.
- **Anatomy:** brand glyph (deterministic flame gradient from seed) · name · role word · chevron. Expanded: grouped list (Customer / Merchants / Issuer / Admin) + footer affordance ("Launch a program", "Become an issuer").
- **States:** default, open, hover, active row (flame ring), loading (skeleton row).
- **Empty:** wallet with no extra roles → renders as a static "Customer" identity, no chevron.

### 4.2 `SidebarGroup`
- **Props:** `label`, `children`. Uppercase mono, `text-[10px] tracking-[0.14em] text-muted-foreground/70`, 8px top padding. Optional `collapsible` for advanced groups (Compliance, Governance) — collapsed by default.

### 4.3 `NavItem`
- **Props:** `to`, `label`, `icon`, `exact?`, `trailing?` (count / status dot), `disabled?` + `disabledReason?`.
- **States:** default · hover (`bg-secondary`) · **active** (flame text + 2px left flame indicator bar, via `data-[status=active]`) · disabled (muted, tooltip explains why, e.g. "Requires a funded reserve"). Never render a dead link — disabled items teach.
- **Trailing meta:** a small tabular count (e.g. Offers · 6) or a state dot (guard paused → amber). No pill chrome.

### 4.4 `CommandPalette` (⌘K / Ctrl-K) — new
- Global overlay, fuzzy search across the Action Registry + merchants + tokens.
- Sections: _Actions_ (role-scoped), _Go to_ (pages), _Merchants_, _Recent_.
- Enter routes to `action.route` and auto-opens `action.intent` (the action panel). This is the power-user spine and a strong launch differentiator.

### 4.5 `AppTopbar`
- Left: mobile menu + breadcrumb/page context. Center (≥md): command-palette trigger ("Search or jump to… ⌘K"). Right: Devnet status, `NotificationBell`, `AccountMenu`.

### 4.6 `MobileTabBar`
- 4–5 icons = the active workspace's primary destinations. Active = flame. Safe-area aware.

### 4.7 Reused primitives (unchanged, already standardized)
`PageHeader`, `Section` / `SectionMeta` / `EmptySlate`, `Metric`, `ActionPanel` (+ fields), `settings-kit` (`Group`/`Row`/`DataRow`/`FieldRow`/`Switch`/`Segmented`/`Input`). Every page composes from these — no page invents its own layout.

---

## 5. CUSTOMER JOURNEY

**Narrative:** _Discover → Earn → Hold → Grow → Spend → Prove → Track._ The dashboard tells this story; the sidebar lets you jump to any stage.

### 5.1 Customer sidebar

```
OVERVIEW
  ▸ Dashboard            /app                 gamified journey home
WALLET
  ▸ Portfolio            /app/wallet          holdings, live decay, per-token detail
  ▸ Swap                 /app/swap            cross-brand alliance swaps
  ▸ Activity             /app/activity        your on-chain history
REWARDS
  ▸ Discover             /app/discover        the brand directory
  ▸ Offers               /app/rewards         redeemable catalog across your brands   (new)
  ▸ Achievements         /app/achievements    tiers, streaks, soulbound badges        (new)
IDENTITY
  ▸ Credentials          /app/verify          held attestations + what they unlock
PROTOCOL  (shared)
  ▸ Network              /app/network
```

### 5.2 Customer actions — the complete inventory

| Journey stage | Action | Instruction | Where (route · intent) | Notes / gating |
|---|---|---|---|---|
| Discover | Browse & search brands | — (read) | `/app/discover` | filter by category / verified / held |
| Discover | View a brand | — (read) | `/app/merchant/:address` | offers, campaigns, how to earn |
| Earn | (Receive points at counter) | `earn_points` (merchant signs) | shown as result on `/app` & token detail | customer is recipient; surfaced as streak/tier movement |
| Hold | View portfolio & live decay | — (read) | `/app/wallet` | real-time cooling ticker |
| Hold | View token detail | — (read) | `/app/token/:mint` | decay curve, offers, profile |
| Grow | See tier & streak progress | — (read) `CustomerProfile` | `/app` · `/app/achievements` | XP = lifetime earned; ladder Ember→Inferno |
| Grow | **Unlock a verified boost** | `refresh_customer_eligibility` (self, permissionless) | `/app` journey card · `/app/verify` | aegis verdict cache; raises earn multiplier |
| Grow | **Claim an achievement badge** | `grant_achievement` (permissionless) | `/app/achievements` · `?claim=<id>` | threshold-gated; soulbound Kleos |
| Spend | **Redeem an open offer** | `redeem_offer` | `/app/rewards` · `/app/merchant/:a` · `?offer=<id>` | burns points → Receipt |
| Spend | **Redeem a gated offer** | `redeem_offer` + `CustomerEligibility` | same | **segment-gated**; links to Credentials if unmet |
| Spend | **Gift points to a wallet** | Token-2022 transfer via `argus::execute` | `/app/wallet` · `/app/token/:mint` · `?gift=1` | hook-validated velocity caps |
| Spend | **Swap across an alliance** | `swap_points` | `/app/swap` | UI-priced both legs; needs shared alliance |
| Spend | Reclaim receipt rent | `close_receipt` | `/app/activity` · receipt row | housekeeping |
| Prove | View held credentials | — (read) attestations | `/app/verify` | what each unlocks; commitment-only privacy |
| Prove | Inspect any wallet's attestation | — (read) | `/app/verify` (reader) | guard-simulation tool |
| Track | Full activity history | — (read) | `/app/activity` | grouped, paged, categorized |
| (system) | Open wallet velocity state | `open_wallet_state` (argus) | invisible (bundled before first gift) | one-time, auto |

### 5.3 Gamification model (surfaced on `/app` and `/app/achievements`)
- **Tier ladder:** Ember · Kindling · Blaze · Inferno, thresholds `[0, 100k, 1M, 10M]` lifetime earned. Progress bar per brand.
- **Streak multiplier:** +2%/day (200 bps), 30-day cap.
- **Verified boost:** per-segment `boostBps`, self-activated (spec-12), shown as claimable "unlock" cards.
- **Joint cap:** ×2.40 (24000 bps). The multiplier breakdown (base / streak / verified) is the emotional core — already built in `customer-journey.tsx`, extended here to the Achievements page.

### 5.4 New pages to add
- **`/app/rewards` (Offers catalog):** every offer redeemable across the brands you hold, sorted by affordability, gated offers clearly marked with their unlock path. Turns "what can I get right now?" into one screen. Reuses `RedeemFlow` (already segment-aware).
- **`/app/swap`:** promotes `SwapFlow` from a buried card to a first-class Solflare-style swap surface.
- **`/app/achievements`:** the gamification hub — tier progress across brands, streaks, badge gallery (earned + claimable via `grant_achievement`).

---

## 6. MERCHANT JOURNEY

**Narrative:** _Launch → Issue → Engage → Segment → Secure → Ally → Measure._ Grouped so a new merchant is guided top-to-bottom, and an operator jumps straight to a task.

### 6.1 Merchant sidebar

```
OVERVIEW
  ▸ Dashboard            /app/console                program health, KPIs, quick actions
LOYALTY  (the core loop)
  ▸ Issue points         /app/console/issue          earn + campaign issuance
  ▸ Offers               /app/console/offers         catalog + segment gates
  ▸ Campaigns            /app/console/campaigns       multiplier / flat / quest / winback
  ▸ Achievements         /app/console/achievements    soulbound badge definitions
CUSTOMERS
  ▸ Segments             /app/console/segments        verified segmentation (aegis)     (split out)
TOKEN & GUARD
  ▸ Token                /app/console/token           metadata, decay, finalize guard
  ▸ Transfer guard       /app/console/guard           argus policy, lists, pause, degrade (split out)
  ▸ Reserves             /app/console/reserves         proof-of-reserves backing          (new)
NETWORK
  ▸ Alliances            /app/console/alliance         koinon coalitions & swap rates
TRUST & COMPLIANCE   (collapsible, advanced)
  ▸ Compliance           /app/console/compliance       trust root, issue status, clawback, statements (new)
  ▸ Governance           /app/console/governance       governed policy lifecycle & roles  (new)
INSIGHTS
  ▸ Analytics            /app/analytics
PROTOCOL  (shared)
  ▸ Network · Verify
```

### 6.2 Merchant actions — the complete inventory

**Launch & token (owner)** — `/app/console` (register), `/app/console/token`, `/app/console/guard`

| Action | Instruction | Auth | Notes |
|---|---|---|---|
| Register a program (+ mint) | `register_merchant` | owner (becomes authority) | creates Token-2022 mint (hook→argus, perm-delegate, interest-bearing) + treasury |
| Initialize transfer guard | `initialize_transfer_guard` (argus) | merchant authority | onboarding; sets initial policy |
| Update base earn rate | `update_merchant` | owner | |
| Edit token metadata | `update_token_metadata` · `set_token_attribute` | owner | name/symbol/uri + custom attrs |
| Change decay rate | `update_decay_rate` | owner | interest-bearing config |
| Finalize (lock) guard | `finalize_transfer_guard` | owner | burns hook authority — irreversible |
| Close program | `close_merchant` | owner | only when supply == 0 |

**Team & controls (owner)** — `/app/console/token` (settings) or Dashboard settings

| Action | Instruction |
|---|---|
| Add/remove operator | `set_merchant_operator` |
| Pause / resume merchant | `set_merchant_paused` |
| Edit public profile | `update_merchant_profile` |
| Set daily issue cap | `set_daily_issue_cap` |
| Set daily clawback cap | `set_clawback_cap` |
| Enable scoped roles (cashier/campaign mgr) | `set_merchant_governance` |

**Issue (cashier/operator)** — `/app/console/issue`

| Action | Instruction | Gating |
|---|---|---|
| Issue points to a customer | `earn_points` | accreditation-gated (`issue_status == NORMAL`); optional verified-segment boost |
| Issue via campaign | `earn_points_campaign` | + campaign live/eligibility |

**Offers / Campaigns / Achievements (manager to create, owner to close)** — respective pages

| Action | Instruction | Auth |
|---|---|---|
| Create / close offer | `create_offer` / `close_offer` | manager / owner |
| Gate offer on a segment | `set_offer_segment` | manager |
| Create / update / close campaign | `create_campaign` / `update_campaign` / `close_campaign` | manager / owner / owner |
| Set campaign winback | `set_campaign_winback` | manager |
| Create / close achievement | `create_achievement` / `close_achievement` | manager / owner |

**Customers & segments (owner)** — `/app/console/segments`

| Action | Instruction | Notes |
|---|---|---|
| Define verified segments | `set_merchant_segments` | `(issuer, schema)` predicates; aegis-linked |
| (Refresh a customer's verdict) | `refresh_customer_eligibility` | permissionless crank; shown as status |

**Reserves (owner)** — `/app/console/reserves`

| Action | Instruction |
|---|---|
| Open reserve | `open_reserve` |
| Fund reserve | `fund_reserve` |
| Withdraw reserve | `withdraw_reserve` (coverage invariant) |
| Attest reserve (proof-of-reserves) | `attest_reserve` (permissionless) |

**Transfer guard (guard authority = owner)** — `/app/console/guard`

| Action | Instruction | Notes |
|---|---|---|
| Retune policy (caps/flags) | `configure_policy` | disabled once governed |
| Pause peer transfers | `set_guard_paused` | circuit breaker |
| Rotate guard authority | `transfer_guard_authority` / `accept_guard_authority` | two-step |
| Add/remove list entry | `add_list_entry` / `remove_list_entry` | allow/deny |
| Kill a cached eligibility | `invalidate_capability` | |
| Bind trust anchor | `set_trust_anchor` | aegis-linked |
| Set degrade mode | `set_degrade_mode` | manual posture |
| Sanctions fast-freeze | `bump_screening_epoch` | stales all capabilities |
| Purchase premium license | `purchase_license` | pays fee |

**Compliance (owner)** — `/app/console/compliance`

| Action | Instruction |
|---|---|
| Bind issuance to accreditation | `set_merchant_trust` |
| Override issue status (freeze/restore) | `set_merchant_issue_status` |
| Clawback customer points | `clawback` (owner-only, reason required, daily-capped) |
| Anchor economic statement (Merkle) | `anchor_merchant_statement` |

**Governance (per-mint, opt-in)** — `/app/console/governance`

| Action | Instruction | Role |
|---|---|---|
| Adopt governed lifecycle | `initialize_governance` | owner |
| Propose / approve / activate / rollback policy | `propose_policy` / `approve_policy` / `activate_policy` / `rollback_policy` | Author / Approver (≠author) / Activator |
| Pin policy immutable | `pin_policy` | RoleAdmin |
| Propose / apply role change | `propose_role_change` / `apply_role_change` | RoleAdmin (timelocked) |
| Anchor transfer statement | `anchor_statement` | Reporter (license-gated: STATEMENTS) |

**Alliances (alliance authority + dual-sign)** — `/app/console/alliance`

| Action | Instruction | Signers |
|---|---|---|
| Create alliance | `create_alliance` | creator |
| Set params / pause / profile | `set_alliance_params` / `set_alliance_paused` / `update_alliance_profile` | alliance authority |
| Transfer alliance authority | `transfer_alliance_authority` / `accept_alliance_authority` | authority / pending |
| Suspend/reactivate member | `set_member_active` | alliance authority |
| Join / leave alliance | `join_alliance` / `leave_alliance` | dual-sign / merchant |
| Set swap rate / budget | `set_swap_rate` / `set_swap_budget` | dual-sign (merchant + alliance) |

**Measure** — `/app/analytics` (read-only): action mix, throughput, own-business KPIs.

### 6.3 Merchant dashboard (`/app/console`)
Leads with **health** (issue status posture, guard state, reserve coverage, paused flags) and **the day's decisions** (issue points, publish an offer, review a clawback) rendered from the Action Registry's merchant `featured` set — then KPIs (`Metric` grid) and recent program activity.

---

## 7. Issuer & Admin (advanced workspaces)

Surfaced only when detected (§2.1). Same sidebar grammar.

### 7.1 Issuer workspace — `/app/issuer/*`
- **Overview** `/app/issuer` — issuer identity, schemas, live attestation count.
- **Schemas** `/app/issuer/schemas` — `register_schema`, `deprecate_schema`.
- **Attestations** `/app/issuer/attestations` — `issue_attestation`, `update_attestation`, `revoke_attestation`, `erase_attestation` (GDPR), `close_attestation`.
- **Policies** `/app/issuer/policies` — `register_policy`, `deprecate_policy`.
- **Accreditation** `/app/issuer/accreditation` — `register_trust_root`, `accredit_issuer`, `revoke_accreditation`, `set_root_active` (kill-switch).
- **Settings** — `set_issuer_paused`, `set_operator`, `transfer/accept_issuer_authority`.

_(Migrates today's `/app/console/attest` tab out of the merchant console into its own coherent home.)_

### 7.2 Admin workspace — `/app/admin/*`
- **Protocol** `/app/admin` — `set_paused`, `verify_merchant`, `set_admin`/`accept_admin` (two-step), `migrate_config`.
- **Licensing (argus)** `/app/admin/licensing` — `set_license_fee`, `set_license`, `withdraw_fees`, `transfer/accept_protocol_authority`.

_(Migrates today's account-overlay Admin section into a real workspace; the overlay keeps only personal settings.)_

---

## 8. Proposed route tree (MPA)

```
/app                              Customer · Dashboard
/app/wallet                       Customer · Portfolio
/app/token/:mint                  Customer · Token detail
/app/swap                         Customer · Swap                     (new)
/app/activity                     Customer · Activity
/app/discover                     Customer · Discover
/app/merchant/:address            Customer · Brand detail
/app/rewards                      Customer · Offers catalog           (new)
/app/achievements                 Customer · Achievements & tiers     (new)
/app/verify                       Shared   · Credentials + reader
/app/network                      Shared   · Network explorer

/app/console                      Merchant · Dashboard (or Register)
/app/console/issue                Merchant · Issue points
/app/console/offers               Merchant · Offers
/app/console/campaigns            Merchant · Campaigns
/app/console/achievements         Merchant · Achievements
/app/console/segments             Merchant · Segments                 (split from advanced)
/app/console/token                Merchant · Token & team
/app/console/guard                Merchant · Transfer guard           (split from token)
/app/console/reserves             Merchant · Reserves                 (new)
/app/console/alliance             Merchant · Alliances
/app/console/compliance           Merchant · Compliance               (new)
/app/console/governance           Merchant · Governance               (new)
/app/analytics                    Merchant · Analytics

/app/issuer, /app/issuer/*        Issuer workspace                    (new)
/app/admin, /app/admin/*          Admin workspace                     (new)
```

Console tabs remain deep-linkable via the existing `app.console_.$tab.tsx` pattern; new areas get their own files. `/app/alliances` (currently orphaned) is folded into `/app/console/alliance` for merchants and referenced from `/app/swap` for customers.

---

## 9. Light theme

The dark theme is the brand's home; the light theme must feel like the **same brand at noon**, not a default shadcn greyscale. Two problems today: (a) shared/global tokens that only make sense in dark, (b) greyscale charts and hardcoded dark shadows.

### 9.1 Token fixes (in `src/index.css`)

**Make these per-theme (currently global/dark-only):**
- `--color-line-strong` — move into `:root` (light) and `.dark`. Light: a warm mid grey (`oklch(0.86 0.01 70)`); dark keeps `#3a342e`.
- Brand accent for text/icons — introduce `--brand` / `--brand-hover` tokens resolved per theme so `text-flame` reads correctly on both. Light uses the deeper flame (`#c23a05`) for AA on white; dark uses `#e2470a`. Keep the literal `--color-flame*` scale for gradients/glows.

**Light palette (warm paper, not clinical white):**
```
--background:        oklch(0.985 0.006 70)   /* warm off-white */
--foreground:        #201b17                  /* warm near-black, AA on bg */
--card:              oklch(1 0 0)             /* pure white cards lift off paper */
--popover:           oklch(1 0 0)
--primary:           #c23a05                  /* deep flame */
--primary-foreground:#fff7f2
--secondary/muted/accent: oklch(0.955 0.006 70)  /* warm greys */
--muted-foreground:  oklch(0.44 0.01 60)      /* darkened for AA (was 0.556) */
--border/input:      oklch(0.90 0.008 70)     /* warm hairline */
--ring:              #c23a05
--brand:             #c23a05  --brand-hover: #e2470a
--color-line-strong (light): oklch(0.86 0.01 70)
```

**Charts — a real flame family (both themes), replacing greyscale:**
```
--chart-1: #e2470a  --chart-2: #f2872f  --chart-3: #f4b15e
--chart-4: #7a2604  --chart-5: #c23a05
```

**Sidebar (light) — fix the stray purple in dark too:**
- Dark `--sidebar-primary` is currently purple (`oklch(0.488 0.243 264)`) — retune to flame in both themes.
- Light sidebar: `--sidebar: oklch(0.975 0.006 70)`, warm border, flame active.

### 9.2 Component-level fixes
- **Shadows:** replace hardcoded `shadow-[…rgba(0,0,0,0.75)]` with a tokenized `--shadow-card` (light: soft, low-alpha, slightly cool; dark: deep). Add utilities `shadow-card` / `shadow-card-lg`.
- **Switch knob:** the `bg-white` knob → `--switch-knob` token (white on dark, white with subtle border on light so it reads on light tracks).
- **Glass panels:** `bg-white/[0.05]` overlays in landing/hero read invisible on light — gate the white-tint decoratives behind the dark variant or swap to `bg-foreground/[0.03]`.
- **Grid fade / glows:** `.bg-grid-fade` and flame radial glows tuned down for light (lower opacity) so they remain ambient, not muddy.

### 9.3 Acceptance
- Every `/app` page passes WCAG AA for body text and interactive labels in light.
- No element "disappears" (invisible borders/knobs/overlays) when toggled to light.
- The flame accent remains unmistakably the brand in both themes; charts are legible and on-brand.
- Theme toggle (existing `.dark` class mechanism, `light|dark|system`) unchanged; only tokens/components fixed.

---

## 10. Implementation plan (vertical slices)

Ship in slices that each leave the app fully working and green (typecheck · test · biome · build).

1. **Foundations** — Action Registry (`src/lib/nav/actions.ts`), `WorkspaceContext` (roles + selected merchant), light-theme token pass (§9.1). _No visible nav change yet; theme becomes usable immediately._
2. **Nav component kit** — `WorkspaceSwitcher`, `SidebarGroup`, `NavItem`, `SidebarFooter`, `MobileTabBar`, `AppTopbar`; refactor `shell.tsx` to render from the registry. Customer + Merchant sidebars go live grouped.
3. **Command palette** — `CommandPalette` (⌘K) over the registry.
4. **Customer new pages** — `/app/rewards`, `/app/swap`, `/app/achievements`; wire gamification hub.
5. **Merchant restructure** — split console into grouped pages (`segments`, `guard`, `reserves`, `compliance`, `governance`); dashboard health + featured actions.
6. **Issuer & Admin workspaces** — migrate `attest` tab and account-overlay Admin into real workspaces.
7. **Polish** — component-level light fixes (§9.2), motion, empty/disabled states, mobile tab bar, a11y pass.

Each slice is independently reviewable and shippable.

---

## 11. Success criteria (what "10/10" means)

- A first-time customer understands, within one screen, **what they have, what they can do next, and how to grow** — and can reach any action in ≤2 clicks or one ⌘K.
- A merchant sees their program's **health and today's decisions first**, and every one of the ~50 merchant actions above has exactly one obvious home.
- **No capability is undiscoverable** — the registry guarantees the sidebar + palette expose everything the role can do; disabled items explain their prerequisite.
- The light theme is **indistinguishably premium** from dark; neither feels like the afterthought.
- The whole surface is built from **one documented component kit** — visually and behaviorally consistent, launch-ready.
```
