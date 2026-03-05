# OrbTap UI Kit v1

How to use design tokens and canonical components for a consistent, investor-grade UI.

## Token system (single source of truth)

- **Theme module:** `constants/Theme.ts`
  - `getThemeTokens(colorMode, uiVersion)` → colors, spacing, radius, motion, elevation, typography
  - `getSurfaceStyles`, `getTextStyles`, `getBorderStyles`, `getMaterialStyles`
- **Hook:** `useTheme()` from `hooks/useTheme.ts`
  - Returns: `colors`, `isDark`, `tokens`, `surfaces`, `textStyles`, `borders`, `materials`, `uiVersion`, `themePreference`
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40 (use `tokens.spacing` or `SPACE` from `constants/DesignTokens.ts`)
- **Radius scale:** 12, 16, 20, 24 (use `tokens.radius` or `RADIUS`)
- **Membership badges:** Silver / Gold / Platinum — use `MEMBERSHIP_TIER_COLORS` from `constants/Theme.ts` (separate from rarity tiers)

## When to use Classic vs Kit v1

- **Admin Hub → UI Version:** Classic (current look) or Kit v1 (new design system).
- Screens that have been migrated to Kit v1 use `components/ui/*` and tokens when `uiVersion === 'kit_v1'`.
- When `uiVersion === 'classic'`, existing components and styles stay as-is.

## Canonical components (`components/ui/`)

| Component | Use |
|-----------|-----|
| `KitScreen` | Safe area, background, optional scroll, bottom padding |
| `KitTopBar` | Top bar with title, left/right slots |
| `KitSectionHeader` | ALL CAPS section label; `label`, `right` slot, `color`, `paddingHorizontal`, `marginTop` |
| `KitCard` | Card with variant: nightglass, lightglass, solid |
| `KitFeatureCard` | Hero card with gradient for featured/promo content |
| `KitButton` | `variant` (primary/secondary/ghost/destructive), `size` (sm/md/lg), `leftIcon`, `rightIcon`, `fullWidth`, `haptic`, `loading`, `disabled` |
| `KitChip` | Filter chips |
| `KitInput` | Text input with label and error |
| `KitSearchBar` | Search field |
| `KitBanner` | Info/success/warn/error banner |
| `KitEmptyState` | `title`, `subtitle`, `icon` (Ionicons), `cta` `{label,onPress}`, `secondaryLink` `{label,onPress}`, `size` (sm/md) |
| `KitAccordion` | Animated expand/collapse panel; `title`, `subtitle`, `expanded`, `onToggle`, `rightAction` |
| `KitSkeleton` | Loading placeholder |
| `SkeletonCard` | Card-shaped shimmer skeleton |
| `KitBadge` | Verified, Sponsored, Silver, Gold, Platinum |
| `KitStatPill` | Stat value + label |
| `KitListRow` | List row with title, subtitle, left/right |
| `OrbGlowFocus` | Glow/border for primary CTA or active selection |
| `OrbDivider` | Section divider |
| `OrbMotion` | Press feedback wrapper |
| `AnimatedNumberCounter` | Animated numeric value (OT Points, counters) |
| `ProgressRing` | Circular progress (XP bar, mission progress) |
| `ReceiptTape` | Vertical key-value list (Proof Card, Wallet ledger) |

Import from `components/ui` (barrel) — e.g. `import { KitButton, KitEmptyState } from '../components/ui';`

## Rules for migrated screens

1. No hardcoded hex/rgba — use `colors.*` from `useTheme()`.
2. Spacing/radius only from token scale (`tokens.spacing`, `tokens.radius`).
3. Prefer Kit components when `uiVersion === 'kit_v1'`.
4. Scroll-safe bottom padding (safe area + token padding).
5. Light mode must look intentionally designed (not inverted).

## Consistency gate (regression scan)

Run the scanner to find hardcoded colors and non-token spacing/radius:

```bash
node scripts/scan-ui-consistency.js
```

Allowlisted: `constants/Colors.ts`, `constants/Theme.ts`, `constants/DesignTokens.ts`, `constants/UIConfig.ts`, `constants/OrbIconography.ts`, `components/ui/`.

Exit code 1 if violations are found; fix by replacing with tokens or add to allowlist only when justified.

## Anti-patterns (never do)

| Don't | Do instead |
|---|---|
| `color: '#22C55E'` | `color: colors.success` |
| `color: '#ef4444'` | `color: colors.error` |
| `color: '#888'` | `color: colors.textSecondary` |
| `backgroundColor: '#111'` / `'#222'` | `backgroundColor: colors.surface` |
| Custom `TouchableOpacity` + `Text` button | `KitButton` |
| `<Text>No content yet</Text>` raw empty state | `KitEmptyState` with `icon` + `cta` |
| Section label inline `Text` with uppercase | `KitSectionHeader` |
| Hardcoded `fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'` | `KitSectionHeader` |
| `StyleSheet.create` with hardcoded colors | Move color-dependent styles inline with `colors.*` |
