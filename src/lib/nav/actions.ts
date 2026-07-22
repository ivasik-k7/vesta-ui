import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowLeftRight,
  Award,
  BadgeCheck,
  BarChart3,
  Compass,
  Gauge,
  Gift,
  Globe,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Trophy,
  Undo2,
  Wallet,
} from 'lucide-react'

import type { WorkspaceKind } from '@/lib/workspace/context'

/**
 * The Action Registry — the single source of truth for everything a role can
 * do in the app today. The sidebar, ⌘K command palette, dashboard quick-actions
 * and empty-state CTAs all render from this catalog, so a capability declared
 * here is discoverable everywhere. Each entry names the on-chain instruction it
 * maps to for traceability with the programs. Instructions that do not yet have
 * a client builder / surface are tracked in docs/FINDINGS-UI-REVIEW.md.
 */

export type ActionRole = WorkspaceKind | 'shared'

export type Gating =
  | 'segment'
  | 'accreditation'
  | 'license'
  | 'governance'
  | 'owner-only'
  | 'operator'
  | 'dual-sign'

export interface AppAction {
  id: string
  role: ActionRole
  /** Sidebar / journey group label (uppercase-rendered). */
  group: string
  label: string
  hint?: string
  icon: LucideIcon
  /** Destination route that hosts this action. */
  route: string
  /** Optional query/param that opens the action panel directly (deep-link). */
  intent?: string
  /** On-chain instruction this maps to (traceability; omit for read/nav). */
  instruction?: string
  gating?: Gating
  /** Featured on the workspace dashboard as a primary quick-action. */
  featured?: boolean
  /** True for a page destination (shows in sidebar); false for an in-page action. */
  nav?: boolean
}

// ── Customer ─────────────────────────────────────────────────────────────────

const CUSTOMER: AppAction[] = [
  {
    id: 'customer.dashboard',
    role: 'customer',
    group: 'Overview',
    label: 'Dashboard',
    hint: 'Your gamified journey home',
    icon: LayoutDashboard,
    route: '/app',
    nav: true,
  },

  {
    id: 'customer.portfolio',
    role: 'customer',
    group: 'Wallet',
    label: 'Portfolio',
    hint: 'Holdings, cooling in real time',
    icon: Wallet,
    route: '/app/wallet',
    nav: true,
  },
  {
    id: 'customer.swap',
    role: 'customer',
    group: 'Wallet',
    label: 'Swap',
    hint: 'Trade points across an alliance',
    icon: ArrowLeftRight,
    route: '/app/swap',
    instruction: 'swap_points',
    nav: true,
    featured: true,
  },
  {
    id: 'customer.activity',
    role: 'customer',
    group: 'Wallet',
    label: 'Activity',
    hint: 'Your on-chain history',
    icon: Activity,
    route: '/app/activity',
    nav: true,
  },

  {
    id: 'customer.discover',
    role: 'customer',
    group: 'Rewards',
    label: 'Discover',
    hint: 'Browse every brand',
    icon: Compass,
    route: '/app/discover',
    nav: true,
    featured: true,
  },
  {
    id: 'customer.rewards',
    role: 'customer',
    group: 'Rewards',
    label: 'Offers',
    hint: 'Everything you can redeem now',
    icon: Ticket,
    route: '/app/rewards',
    instruction: 'redeem_offer',
    nav: true,
    featured: true,
  },
  {
    id: 'customer.achievements',
    role: 'customer',
    group: 'Rewards',
    label: 'Achievements',
    hint: 'Tiers, streaks & badges',
    icon: Trophy,
    route: '/app/achievements',
    instruction: 'grant_achievement',
    nav: true,
  },

  // in-page / palette actions (hosted on the routes above / shared Verify page)
  {
    id: 'customer.credentials',
    role: 'customer',
    group: 'Rewards',
    label: 'My credentials',
    hint: 'Proofs you hold & what they unlock',
    icon: KeyRound,
    route: '/app/verify',
  },
  {
    id: 'customer.gift',
    role: 'customer',
    group: 'Wallet',
    label: 'Gift points',
    hint: 'Send points to another wallet',
    icon: Gift,
    route: '/app/wallet',
    intent: 'gift',
    featured: true,
  },
  {
    id: 'customer.unlock',
    role: 'customer',
    group: 'Rewards',
    label: 'Unlock a verified boost',
    hint: 'Activate a segment boost',
    icon: Sparkles,
    route: '/app',
    instruction: 'refresh_customer_eligibility',
    gating: 'segment',
  },
]

// ── Merchant ─────────────────────────────────────────────────────────────────

const MERCHANT: AppAction[] = [
  {
    id: 'merchant.dashboard',
    role: 'merchant',
    group: 'Overview',
    label: 'Dashboard',
    hint: 'Program health & controls',
    icon: LayoutDashboard,
    route: '/app/console',
    nav: true,
  },

  {
    id: 'merchant.issue',
    role: 'merchant',
    group: 'Loyalty',
    label: 'Issue points',
    hint: 'Reward a customer at the counter',
    icon: Gift,
    route: '/app/console/issue',
    instruction: 'earn_points',
    gating: 'accreditation',
    nav: true,
    featured: true,
  },
  {
    id: 'merchant.offers',
    role: 'merchant',
    group: 'Loyalty',
    label: 'Offers',
    hint: 'Redeemable catalog',
    icon: Ticket,
    route: '/app/console/offers',
    instruction: 'create_offer',
    nav: true,
    featured: true,
  },
  {
    id: 'merchant.campaigns',
    role: 'merchant',
    group: 'Loyalty',
    label: 'Campaigns',
    hint: 'Multiplier, flat & quest boosts',
    icon: Megaphone,
    route: '/app/console/campaigns',
    instruction: 'create_campaign',
    nav: true,
  },
  {
    id: 'merchant.achievements',
    role: 'merchant',
    group: 'Loyalty',
    label: 'Achievements',
    hint: 'Soulbound badge definitions',
    icon: Award,
    route: '/app/console/achievements',
    instruction: 'create_achievement',
    nav: true,
  },

  {
    id: 'merchant.alliance',
    role: 'merchant',
    group: 'Network',
    label: 'Alliances',
    hint: 'Coalitions & swap rates',
    icon: Handshake,
    route: '/app/console/alliance',
    instruction: 'join_alliance',
    nav: true,
  },

  {
    id: 'merchant.token',
    role: 'merchant',
    group: 'Configuration',
    label: 'Token & guard',
    hint: 'Mint metadata, decay & transfer policy',
    icon: ShieldCheck,
    route: '/app/console/token',
    instruction: 'update_token_metadata',
    gating: 'owner-only',
    nav: true,
  },
  {
    id: 'merchant.controls',
    role: 'merchant',
    group: 'Configuration',
    label: 'Team & controls',
    hint: 'Operators, caps & clawback',
    icon: Gauge,
    route: '/app/console/advanced',
    instruction: 'set_merchant_operator',
    gating: 'owner-only',
    nav: true,
  },

  {
    id: 'merchant.analytics',
    role: 'merchant',
    group: 'Insights',
    label: 'Analytics',
    hint: 'On-chain program metrics',
    icon: BarChart3,
    route: '/app/analytics',
    nav: true,
  },

  // in-page / palette actions
  {
    id: 'merchant.launch',
    role: 'merchant',
    group: 'Overview',
    label: 'Launch a program',
    hint: 'Register a new loyalty token',
    icon: Store,
    route: '/app/console',
    instruction: 'register_merchant',
  },
  {
    id: 'merchant.clawback',
    role: 'merchant',
    group: 'Configuration',
    label: 'Clawback points',
    hint: 'Confiscate points (owner-only, audited)',
    icon: Undo2,
    route: '/app/console/advanced',
    instruction: 'clawback',
    gating: 'owner-only',
  },
]

// ── Issuer ───────────────────────────────────────────────────────────────────

const ISSUER: AppAction[] = [
  {
    id: 'issuer.attestations',
    role: 'issuer',
    group: 'Overview',
    label: 'Attestations',
    hint: 'Issue & revoke credentials',
    icon: BadgeCheck,
    route: '/app/issuer',
    instruction: 'issue_attestation',
    nav: true,
    featured: true,
  },
]

// ── Admin ────────────────────────────────────────────────────────────────────

const ADMIN: AppAction[] = [
  {
    id: 'admin.protocol',
    role: 'admin',
    group: 'Overview',
    label: 'Protocol',
    hint: 'Pause, verify merchants, admin handover',
    icon: Gauge,
    route: '/app/admin',
    instruction: 'set_paused',
    nav: true,
  },
]

// ── Shared (all workspaces) ────────────────────────────────────────────────────

const SHARED: AppAction[] = [
  {
    id: 'shared.network',
    role: 'shared',
    group: 'Protocol',
    label: 'Network',
    hint: 'Protocol-wide explorer',
    icon: Globe,
    route: '/app/network',
    nav: true,
  },
  {
    id: 'shared.verify',
    role: 'shared',
    group: 'Protocol',
    label: 'Verify',
    hint: 'Credentials & attestation reader',
    icon: BadgeCheck,
    route: '/app/verify',
    nav: true,
  },
]

export const ACTIONS: AppAction[] = [...CUSTOMER, ...MERCHANT, ...ISSUER, ...ADMIN, ...SHARED]

/** Ordered group labels per role — drives sidebar group sequence. */
export const GROUP_ORDER: Record<WorkspaceKind, string[]> = {
  customer: ['Overview', 'Wallet', 'Rewards'],
  merchant: ['Overview', 'Loyalty', 'Network', 'Configuration', 'Insights'],
  issuer: ['Overview'],
  admin: ['Overview'],
}

/** Groups (advanced) that render collapsed by default in the sidebar. */
export const COLLAPSED_GROUPS = new Set<string>([])

/** Nav destinations for a workspace kind, in group order. */
export function navActionsFor(kind: WorkspaceKind): AppAction[] {
  return ACTIONS.filter((a) => a.role === kind && a.nav)
}

/** Shared protocol destinations (appended to every workspace sidebar). */
export function sharedNavActions(): AppAction[] {
  return SHARED.filter((a) => a.nav)
}

/** Featured quick-actions for a workspace dashboard. */
export function featuredActionsFor(kind: WorkspaceKind): AppAction[] {
  return ACTIONS.filter((a) => a.role === kind && a.featured)
}

/** Everything a role can reach — for the ⌘K palette (role first, then shared). */
export function paletteActionsFor(kind: WorkspaceKind): AppAction[] {
  return [...ACTIONS.filter((a) => a.role === kind), ...SHARED]
}
