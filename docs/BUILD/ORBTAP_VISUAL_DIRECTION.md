# OrbTap Visual Direction

One-page reference for the **Refined Premium Dark** aesthetic. Use this for all high-impact screens and shared components.

---

## Purpose

Rewards/loyalty + discovery. Users and partners should feel the app is **premium**, **trustworthy**, and worth using often. Every screen should feel intentional and memorable.

---

## Tone

- **Refined premium dark** — confident, not loud. Dark-first with sharp accents.
- **Do**: One clear hero moment per screen; dominant dark with neon blue and gold as accents; distinctive type.
- **Don’t**: Generic purple-on-white gradients; system fonts only; flat, even color distribution; cluttered motion.

---

## Typography

- **Display** (hero, section titles, nav labels): Distinctive, characterful. Use for: landing headline, Orb Hub hero, tab labels, card titles. Avoid Inter, Roboto, Arial, system default as primary.
- **Body** (copy, CTAs, captions): Refined, readable. Use for: descriptions, buttons, secondary text.
- **Rule**: Pair one display font with one body font everywhere. All major headings and body copy come from theme tokens.

---

## Color

- **Dominant**: Dark background (`#000` / `#111`); surfaces one step up (`#111`, `#1c1c1e`).
- **Accents**: Neon blue primary (`#60a5fa` / `#3b82f6`); gold for rewards/earn (`#fbbf24` / `#d97706`). Use sparingly for CTAs, active states, and highlights.
- **Optional**: Subtle gradient meshes or soft glow on hero and key cards (e.g. balance card, featured partner card) for depth. No purple-on-white clichés.

---

## Motion

- **Principle**: One clear “hero” moment per screen (e.g. staggered FadeInDown: logo → headline → stats → CTAs). Use consistent stagger (80–120 ms) from design tokens.
- **Keep**: Existing reanimated usage; add one high-impact entrance per major screen.
- **Optional**: One signature micro-interaction per screen (e.g. card tap, tab switch) without changing flow.

---

## Spatial composition

- Asymmetry or grid-breaking only where it supports hierarchy (e.g. hero vs list).
- Avoid generic, uniform card grids everywhere. Prefer clear visual hierarchy: hero → primary content → secondary.

---

## Do / Don’t

- **Do**: Use theme typography (display + body) for all headings and body; one dominant background and sharp accent usage; one hero motion sequence per screen; optional depth (gradient/glow) on key cards.
- **Don’t**: Use system/default font as primary; spread accent colors evenly; add motion everywhere; use purple gradients on white or generic AI-style layouts.

---

## Token reference

- **Hero stagger**: `HERO_STAGGER_MS` in [constants/DesignTokens.ts](constants/DesignTokens.ts) (100 ms between elements).
- **Typography**: Theme `typography.title`, `typography.heading`, `typography.body`, `typography.caption`; include `fontFamily` once added in Phase 1.
- **Surfaces**: Theme `colors.background`, `colors.surface`, `colors.surfaceHighlight`; optional `heroGradient` / `cardGlow` for hero and cards.

---

## Phase 4 rollout

Theme typography and motion are applied to: Landing (hero stagger), Orb Hub (title + live strip stagger), FeaturedPartnerCard, Wallet (balance strip labels), WebLandingPage (accessibility). Remaining screens (auth, partner, admin, bounty, orbsignal, etc.) can adopt `textStyles` and `HERO_STAGGER_MS` incrementally; prefer user- and partner-facing screens first.

