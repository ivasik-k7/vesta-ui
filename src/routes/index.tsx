import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ExternalLink, Eye, Flame, Handshake, Medal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { env } from '@/env'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const FEATURES = [
  {
    icon: Flame,
    title: 'Living points',
    description:
      'Points decay like an untended flame. Visits, streaks, and quests earn multipliers that keep the value alive — loyalty you can feel ticking.',
    accent: 'text-solana-green',
  },
  {
    icon: Handshake,
    title: 'Koinon alliances',
    description:
      'Merchants form on-chain alliances. Swap coffee points for bookstore points atomically, at rates the alliance governs.',
    accent: 'text-solana-purple',
  },
  {
    icon: Medal,
    title: 'Kleos badges',
    description:
      'Soulbound achievements that cannot be bought or transferred — only earned. Any dApp can token-gate on them, permissionlessly.',
    accent: 'text-solana-green',
  },
  {
    icon: Eye,
    title: 'Argus guard',
    description:
      'A transfer hook watches every point transfer: gifting within limits, no mercenary dumping. The rules travel with the token.',
    accent: 'text-solana-purple',
  },
] as const

const PROGRAMS = [
  { name: 'vesta_core', id: env.VITE_VESTA_CORE_PROGRAM_ID },
  { name: 'argus', id: env.VITE_ARGUS_PROGRAM_ID },
] as const

function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(153,69,255,0.15),transparent_60%)]"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center md:py-32">
          <Badge
            variant="outline"
            className="gap-1.5 border-solana-green/40 px-3 py-1 text-solana-green"
          >
            <Flame className="size-3.5" aria-hidden />
            On-chain loyalty, alive by design
          </Badge>
          <h1 className="max-w-3xl text-balance font-heading text-5xl font-bold tracking-tight md:text-7xl">
            Loyalty that burns{' '}
            <span className="bg-gradient-to-r from-solana-purple via-solana-green to-solana-green bg-clip-text text-transparent">
              brighter
            </span>{' '}
            the more you show up
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
            VESTA turns loyalty points into a living Solana primitive: value that decays when
            ignored, grows with streaks, swaps across merchants, and unlocks soulbound achievements.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/app">
                Open the app
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/ivasik-k7/vesta-core" target="_blank" rel="noreferrer">
                Read the architecture
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="border-border/60 bg-card/50">
              <CardHeader>
                <feature.icon className={`size-6 ${feature.accent}`} aria-hidden />
                <CardTitle className="pt-2">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Live on devnet</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Both programs are deployed and verifiable. The IDL is published on-chain — any dApp can
            compose with VESTA without asking permission.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PROGRAMS.map((program) => (
              <Card key={program.id} className="border-border/60 bg-card/50">
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="min-w-0">
                    <p className="font-medium">{program.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{program.id}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <a
                      href={`https://explorer.solana.com/address/${program.id}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
