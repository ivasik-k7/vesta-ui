style and compositional references: https://nu.fi/
colors for dark theme: sicilian orange + black

# REFERENCE.md — UI Style & Composition Reference

## Primary reference

- Style and compositional reference: https://nu.fi/
- Dark theme palette: **Sicilian orange + black** (replaces nu.fi's native accent)
- Analysis date: 2026-07-19 (landing page, live fetch)

---

## 1. Site anatomy — section inventory (nu.fi landing page)

The page is a single long-scroll landing composed of **12 sections** in this exact order:

| #   | Section                    | Composition                                                                                                                                                                                                                                                                                |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Sticky nav**             | Logo left, single primary CTA right ("Get Extension"). Minimal — no link clutter.                                                                                                                                                                                                          |
| 2   | **Hero**                   | Kicker line → H1 with dual-weight emphasis → one-sentence subheadline → two CTAs (primary + secondary "Go to Web App") → full-width product screenshot below the fold line.                                                                                                                |
| 3   | **Brand quote**            | Single standalone founder/brand statement in quotation marks. Acts as a breather between hero and features.                                                                                                                                                                                |
| 4   | **"Why" section**          | Kicker ("Why NUFI?") + H2 ("4 reasons to switch") + exactly 4 feature blocks, alternating text/image, some with a single "Learn more" link.                                                                                                                                                |
| 5   | **Multichain / ecosystem** | Kicker ("Wide reach. Total control.") + H2 + logo row of supported chains + mascot illustration + one outbound link ("See all supported Chains").                                                                                                                                          |
| 6   | **Stats bar**              | Kicker ("Powering DeFi") + H2 ("On-chain. At scale.") + 3 big-number stats: `100+ chains`, `150K+ transactions`, `$220M+ staked`. Short units, no paragraphs.                                                                                                                              |
| 7   | **Features grid (bento)**  | Kicker ("Explore features") + H2 ("**Everything** you need") + mixed-size cards: NFT gallery w/ image thumbnails, security scanning, DApp compatibility with 6-logo strip, buy/trade, integrated DEX, wallet migration (playful copy: "Ghosted by your wallet? Migrate!"), smart accounts. |
| 8   | **Testimonials**           | Kicker ("Trusted by the community") + H2 + external rating badge (Trustpilot 4.7/5) + 6 short quotes with initial-avatars and country flags. One long quote, five one-liners.                                                                                                              |
| 9   | **Get started**            | Kicker ("Enter NUFI") + H2 + 3 numbered steps, each a single sentence. First step doubles as CTA link.                                                                                                                                                                                     |
| 10  | **FAQ**                    | Kicker ("We've got answers") + H2 + accordion of 5 questions (collapsed by default).                                                                                                                                                                                                       |
| 11  | **Footer**                 | Contact block (physical address + email), social row (X, Discord, GitHub, Reddit), 5 link columns: Features / Product / Support / About / Build, legal links, copyright.                                                                                                                   |
| 12  | **Newsletter**             | H2 ("Don't miss out") + one-line pitch + email input + playful microcopy ("Join the gorillas!") + reassurance line ("You can unsubscribe at any time").                                                                                                                                    |

**Section count criterion:** 10–12 sections. Order of persuasion: promise → proof (product shot) → reasons → reach → numbers → features → social proof → onboarding → objections (FAQ) → capture (newsletter).

---

## 2. Compositional rules extracted

### 2.1 The kicker + heading pattern (used in every section)

Every section header follows a strict two-line pattern:

```
kicker (small, muted, sentence-case, punchy — sometimes with periods: "Wide reach. Total control.")
H2 (large, 2–5 words max)
```

- Kickers are 2–5 words, often rhythmic or paired phrases.
- H2s never exceed ~5 words. Longer thoughts get pushed into a subheadline paragraph.

### 2.2 Dual-weight headlines

Headlines mix two visual weights/colors inside one heading:

- Hero: "One wallet **Zero limits**"
- Features: "**Everything** you need"

**Criterion:** at least the hero H1 and one section H2 use split emphasis — one part regular/muted, one part bold/accent (in our case: white + sicilian orange).

### 2.3 Card system

- Feature cards are **bento-style**: mixed sizes, some text-only, some with imagery, some with embedded logo strips.
- Cards carry: `H3 (3–7 words)` + `1–2 sentence body` + optional single link.
- Never more than one link per card.

### 2.4 Social proof, three flavors

nu.fi stacks three distinct proof types — replicate all three:

1. **Numbers** (stats bar, 3 metrics, `N+` format)
2. **Third-party rating** (external badge with score)
3. **Human quotes** (short, with avatar-initials + country flag; 1 long quote max, rest one-liners)

### 2.5 CTA discipline

- One primary action repeated 3× across the page (nav, hero, get-started) — always the same label.
- Hero gets a secondary CTA; nowhere else does.
- Playful CTA microcopy allowed only at the very end (newsletter).

### 2.6 Brand personality via mascot

A recurring mascot illustration (gorilla) appears in 2–3 sections and in copy ("Join the gorillas!"). **Criterion:** if the project has a mascot/motif, thread it through both imagery _and_ microcopy; if not, replace with a consistent visual motif (e.g., citrus/orange-slice geometry for our palette).

### 2.7 Copy tone

- Confident, compressed, benefit-first. Sentences rarely exceed ~15 words.
- Occasional humor in low-stakes spots (migration card, newsletter) — never in the hero or security messaging.
- Technical credibility through specificity (named integrations, exact numbers), not adjectives.

---

## 3. Theme criteria — dark theme, sicilian orange + black

nu.fi ships dark-first (`meta color-scheme: dark`, theme-color `#0c0d0c` — a soft near-black, **not** pure #000). We adopt the same dark-first strategy with our palette.

### 3.1 Color tokens

```css
:root {
  /* Backgrounds — layered near-blacks, never pure #000 for large surfaces */
  --bg-base: #0c0b0a; /* page background (warm near-black) */
  --bg-elevated: #151311; /* cards, nav */
  --bg-subtle: #1e1b18; /* hover states, inset panels */

  /* Sicilian (blood) orange scale — primary accent */
  --accent: #e2470a; /* primary — CTAs, emphasis spans, links */
  --accent-hover: #f25c1f;
  --accent-active: #c23a05;
  --accent-soft: #e2470a1f; /* 12% — tinted backgrounds, badges */
  --accent-deep: #7a2604; /* gradients, glows */

  /* Text */
  --text-primary: #f5efe9; /* warm off-white, pairs with orange */
  --text-secondary: #a79e96; /* kickers, body on dark */
  --text-muted: #6b645d; /* captions, footer legal */

  /* Lines */
  --border: #2a2622;
  --border-strong: #3a342e;
}
```

### 3.2 Color usage rules

- **Orange is scarce.** Reserve it for: primary CTA fill, the emphasized half of dual-weight headlines, link hover, stat numbers, and active states. Target ≤10% of visible surface.
- Body text is never orange. Kickers are `--text-secondary`, not orange (option: orange kickers only if headings stay monochrome — pick one, not both).
- Large surfaces use the warm near-black ramp; pure `#000` only for image letterboxing.
- Orange-on-black passes contrast for large text/UI; for small body-size orange text, use `--accent-hover` or bump size to ≥18px. Verify WCAG AA (4.5:1) for anything under 18px.
- Glows/gradients: radial `--accent-deep` → transparent behind hero art, echoing nu.fi's ambient lighting behind product shots.

### 3.3 Surfaces & depth

- Depth via background-step (base → elevated → subtle) + 1px `--border`, not heavy shadows.
- Cards: radius 16–20px, 1px border, elevated bg. Hover: border brightens to `--border-strong` + subtle orange edge glow on interactive cards only.

---

## 4. Typography criteria

- **Two-weight system within one family** (nu.fi relies on weight contrast, not font mixing). Suggested: a geometric/grotesque sans (e.g., Inter, General Sans, or similar) — Regular 400 for body, Bold 700+ for emphasis spans.
- Scale (desktop):
  - H1: 56–72px, tight leading (~1.05), tight tracking
  - H2: 36–48px
  - H3 (cards): 20–24px
  - Body: 16–18px, leading 1.6
  - Kicker: 13–14px, `--text-secondary`, medium weight, normal case (nu.fi does NOT uppercase kickers)
  - Stats numbers: 48–64px bold, unit/label in body size below
- Headlines may break into two intentional lines (hero does: "One wallet / Zero limits").

---

## 5. Layout & spacing criteria

- Max content width ~1200px, generous horizontal padding.
- Vertical rhythm: large section gaps (~120–160px desktop, ~72–96px mobile) — sections must breathe.
- Hero product screenshot: full-width within container, high-res (nu.fi serves up to 3840w), slight elevation/glow.
- Feature area alternates: full-width rows for the 4 "reasons," then bento grid for the feature explosion.
- Logo strips (chains, DApps): grayscale/monochrome logos at rest is acceptable; keep 5–6 per row.
- Mobile: single column, nav collapses to logo + CTA (no hamburger needed if nav stays minimal).

---

## 6. Interaction & motion criteria

- Accordion FAQ, collapsed by default.
- Buttons: primary = orange fill + dark text or white text (test contrast), radius ~10–12px, subtle scale/brightness on hover; secondary = outline (`--border-strong`) with text-primary.
- Scroll-reveal: gentle fade+rise per section (~300ms, ease-out), staggered on card grids. Nothing bouncy.
- Sticky nav with background blur + border-bottom appearing after scroll.

---

## 7. Content checklist (adapt per project)

- [ ] Kicker + H2 on every section, kicker ≤5 words, H2 ≤5 words
- [ ] Hero: kicker, dual-weight H1, 1-sentence sub, primary + secondary CTA, product visual
- [ ] Exactly 3–4 core "reasons/pillars" section
- [ ] Stats bar with exactly 3 metrics in `N+` format
- [ ] Bento features grid with mixed card sizes, ≤1 link per card
- [ ] 3-layer social proof: numbers, external rating, 5–6 short human quotes
- [ ] 3-step "get started" section
- [ ] FAQ accordion, 5 questions
- [ ] Footer: contact, socials, 4–5 link columns, legal
- [ ] Newsletter capture with playful microcopy + unsubscribe reassurance
- [ ] Primary CTA label identical in all 3 placements
- [ ] Orange usage ≤10% of any viewport; dual-weight emphasis uses orange half

---

## 8. Anti-patterns (things nu.fi deliberately avoids — we avoid too)

- No mega-nav / dropdown menus on landing — nav is logo + 1 CTA.
- No uppercase kickers or letter-spaced ALL-CAPS labels.
- No pure-black backgrounds or pure-white text (warm-tinted both ways).
- No walls of text — no paragraph exceeds 2 sentences outside FAQ answers.
- No more than one accent color in the UI chrome (illustrations may be richer).
- No autoplaying carousels; testimonials are statically laid out.
