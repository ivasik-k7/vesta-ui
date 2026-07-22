import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Flame } from 'lucide-react'
import type { ReactNode } from 'react'

import { env } from '@/env'

const EXPLORER = 'https://explorer.solana.com'

const COLUMNS = [
  {
    heading: 'Protocol',
    links: [
      { label: 'Customer app', to: '/app' },
      { label: 'Merchant console', to: '/app/console' },
      { label: 'Merchant directory', to: '/merchant' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'vesta-core · Rust', href: 'https://github.com/ivasik-k7/vesta-core' },
      { label: 'vesta-sdk · Python', href: 'https://github.com/ivasik-k7/vesta-sdk' },
      { label: 'vesta-ui · React', href: 'https://github.com/ivasik-k7/vesta-ui' },
      {
        label: 'Technical spec',
        href: 'https://github.com/ivasik-k7/vesta-core/blob/main/docs/TECHNICAL_SPEC.md',
      },
    ],
  },
  {
    heading: 'On-chain',
    links: [
      {
        label: 'vesta_core',
        href: `${EXPLORER}/address/${env.VITE_VESTA_CORE_PROGRAM_ID}?cluster=devnet`,
      },
      { label: 'argus', href: `${EXPLORER}/address/${env.VITE_ARGUS_PROGRAM_ID}?cluster=devnet` },
    ],
  },
] as const

function FooterLink({ href, to, children }: { href?: string; to?: string; children: ReactNode }) {
  const className =
    'group inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground'
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      <ArrowUpRight
        className="size-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        aria-hidden
      />
    </a>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-border border-t">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center font-bold font-heading text-[clamp(6rem,18vw,16rem)] leading-[0.75] tracking-tight"
      >
        <span className="bg-clip-text bg-gradient-to-b from-white/[0.05] to-transparent text-transparent">
          VESTA
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-28">
        <div className="grid gap-12 md:grid-cols-[1.2fr_repeat(3,0.7fr)]">
          <div className="flex flex-col items-start gap-4">
            <p className="flex items-center gap-2 font-semibold tracking-tight">
              <Flame className="size-5 text-flame" aria-hidden />
              VESTA
            </p>
            <p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
              The living loyalty protocol on Solana — points that stay alive while you keep the
              flame burning.
            </p>
            <a
              href="https://github.com/ivasik-k7"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              GitHub
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <p className="font-medium text-[13px] text-muted-foreground/70">{column.heading}</p>
              {column.links.map((link) => (
                <FooterLink
                  key={link.label}
                  to={'to' in link ? link.to : undefined}
                  href={'href' in link ? link.href : undefined}
                >
                  {link.label}
                </FooterLink>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-2 border-border border-t pt-6 text-muted-foreground/70 text-xs sm:flex-row sm:items-center">
          <span>© 2026 VESTA · MIT license</span>
          <span className="font-mono">
            v{__APP_VERSION__}-{__GIT_HASH__}
          </span>
          <span>
            built on <span className="font-medium text-flame">Solana</span> · devnet
          </span>
        </div>
      </div>
    </footer>
  )
}
