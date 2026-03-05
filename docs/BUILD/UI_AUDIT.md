# OrbTap — UI/UX Consistency Audit (Phase 0)

Generated: 2026-03-04 | Full repo scan of 178 screen files + 100+ components.

---

## Section 1: Design Token Compliance

### Existing Token System
- `constants/Colors.ts` — dark/light theme color objects + COLORS accents
- `constants/DesignTokens.ts` — SPACE, RADIUS, MOTION, ELEVATION, TAP_TARGET_MIN
- `hooks/useTheme.ts` — provides `colors` object from context

**Assessment: Token system EXISTS but adoption is inconsistent. ~60% of screens use tokens correctly, ~40% have hardcoded values.**

---

## Section 2: Hardcoded Colors Inventory (Priority Fixes)

### HIGH PRIORITY — Dark mode failures / accessibility risk

| File | Line | Hardcoded Value | Should Be |
|------|------|----------------|-----------|
| `app/settings.tsx` | 858 | `color: '#888'` | `colors.textSecondary` |
| `app/settings.tsx` | 860 | `backgroundColor: '#111'` | `colors.surface` |
| `app/settings.tsx` | 860 | `borderColor: '#EF4444'` | `colors.error` (add to theme) |
| `app/proof/[id].tsx` | 157,209,210,238,392 | `#22C55E` (success green) | `COLORS.success` |
| `app/proof/[id].tsx` | 301,372 | `backgroundColor: '#0d0d10'` | `colors.background` |
| `app/proof/[id].tsx` | 321,324,327,381,395 | `color: '#FFF'` | `colors.text` (on dark bg) |
| `app/work-orders/index.tsx` | 184 | `backgroundColor: '#222'` | `colors.surface` |
| `app/work-orders/index.tsx` | 185 | `backgroundColor: '#22C55E'` | `COLORS.success` |
| `app/work-orders/index.tsx` | 186 | `color: '#888'` | `colors.textSecondary` |
| `app/orbswipe.tsx` | 451–649 | `#22c55e`, `#ef4444` | `COLORS.success`, `COLORS.danger` |
| `app/inventory.tsx` | 33–41 | 9 distinct hardcoded hex values | Map to theme or token palette |
| `app/opportunities/my-applications.tsx` | 107 | `'#6b7280'` | `colors.textSecondary` |

### MEDIUM PRIORITY — Inconsistent but not dark-mode-breaking

| File | Issue |
|------|-------|
| `app/(tabs)/orb.tsx` | Some gradient hardcodes inside category cards |
| `app/partner/dashboard.tsx` | Chart bar colors hardcoded |
| `app/leaderboard.tsx` | Row accent colors not from token |
| `app/missions.tsx` | Timer/urgency red hardcoded |
| `components/OrbSheet.tsx` | Some backdrop hardcodes |
| `components/PartnerGridCard.tsx` | Badge color inline |
| `components/FeaturedPartnerCard.tsx` | Overlay gradient hardcoded |

### Tokens to ADD to `constants/Colors.ts`

```typescript
// Add to both dark and light themes:
error: '#ef4444',        // currently hardcoded in many places
success: '#22c55e',      // currently COLORS.success but not in theme object
warning: '#f59e0b',      // used in inventory but hardcoded
info: '#3b82f6',         // currently primary, alias needed
```

---

## Section 3: Component Inconsistency Audit

### Buttons — Multiple Competing Patterns Found

| Pattern | Used In | Problem |
|---------|---------|---------|
| `TouchableOpacity` with inline style | 80+ screens | No press feedback consistency |
| `components/preauth/PrimaryButton.tsx` | Auth screens only | Not reused elsewhere |
| `components/PremiumCTAButton.tsx` | Premium + some others | Not general-purpose |
| `components/SignupCTAButton.tsx` | Auth/marketing | Not reused |
| Inline `Pressable` with custom ripple | Some admin screens | |
| `TouchableOpacity` with `activeOpacity={0.8}` | Most screens | OK but not standardized |

**Fix needed:** Single canonical `<OrbButton variant="primary|secondary|ghost|destructive" />` component used everywhere.

### Cards — Multiple Competing Patterns Found

| Pattern | Used In | Problem |
|---------|---------|---------|
| `PartnerFrostedCard` | Partner dashboard | Glass effect, inconsistent radius |
| `PartnerGridCard` | Discovery grid | Different shadow model |
| `FeaturedPartnerCard` | Home featured | Different border approach |
| `PremiumCard` | Wallet, premium | Different token usage |
| `PremiumPerkCard` | Perk grids | Yet another variant |
| `PremiumPerkTile` | Tile grids | Even another variant |
| `DailyFactCard` | Orb hub | Custom entirely |
| Inline `View` with StyleSheet | 60+ screens | |

**Fix needed:** Single `<OrbCard variant="default|glass|elevated|hero" />` with material options.

### Bottom Sheets — Inconsistent Behavior

| Component | Used Where | Issues |
|-----------|-----------|--------|
| `OrbSheet` (gorhom) | Map partner detail | ✅ Canonical — good |
| `EditProfileSheet` | Profile | Custom Modal instead of gorhom |
| `StampCardModal` | Wallet | Modal (not sheet) |
| `PerkGridModal` | Various | Modal (not sheet) |
| `ReviewSheet` | Partners | Custom |
| `MealProposalDetailSheet` | Meal mode | Custom |
| `OrbSwipeControlsSheet` | OrbSwipe | Custom |
| `ShareToSocialSheet` | Multiple | Custom |

**Fix needed:** All overlays should use `@gorhom/bottom-sheet` with consistent snap points. Currently mixing Modal (no slide-up) with bottom-sheet (slide-up) — janky UX.

### Section Headers — 5+ Competing Styles

Found variations:
- `<Text style={styles.sectionTitle}>` — different font sizes (11px, 12px, 13px, 14px)
- `<Text style={{fontSize: 11, fontWeight: '800', letterSpacing: 1}}>` inline
- `SectionTitle` local component defined in partner/dashboard (not exported)
- `PageHero` component (for hero sections only)
- `CommandCenterHeader` (orb hub variant)

**Fix needed:** Single `<OrbSectionHeader title="" right={} />` component.

---

## Section 4: Typography Inconsistencies

| Issue | Files | Fix |
|-------|-------|-----|
| Font sizes not from scale | Many | Add `FONT` token: `xs:11, sm:12, md:14, base:15, lg:17, xl:20, xxl:24, xxxl:32` |
| `fontWeight` uses mixed string/number | All | Standardize to string `'400'|'500'|'600'|'700'|'800'|'900'` |
| `letterSpacing` inconsistent on section headers | ~15 files | `letterSpacing: 1` for caps headers |
| Line height not set on body text | Most screens | Add `lineHeight: fontSize * 1.5` convention |
| Section header ALL CAPS inconsistent | Some use, some don't | Lock to ALL CAPS + `letterSpacing:1` + `fontWeight:800` |

---

## Section 5: Spacing Violations

| Pattern | Files | Fix |
|---------|-------|-----|
| `paddingHorizontal: 16` hardcoded | 50+ files | Use `SPACE.base` |
| `padding: 12` hardcoded | 30+ files | Use `SPACE.md` |
| `gap: 8` hardcoded | 40+ files | Use `SPACE.sm` |
| `marginBottom: 24` hardcoded | 25+ files | Use `SPACE.xl` |
| `borderRadius: 12` hardcoded | 60+ files | Use `RADIUS.md` |
| `borderRadius: 8` hardcoded | 40+ files | Use `RADIUS.sm` |
| `borderRadius: 9999` hardcoded | 20+ files | Use `RADIUS.full` |

Most files DO import `SPACE` and `RADIUS` but then don't use them consistently — often mixing token use with hardcoded values within the same file.

---

## Section 6: Dark/Light Mode Failures

### Confirmed failures (text invisible or near-invisible)

| File | Issue | Dark Mode | Light Mode |
|------|-------|-----------|------------|
| `app/proof/[id].tsx` | `color: '#FFF'` on card that's always dark bg | ✅ OK | ❌ White text on white/light bg if theme wraps |
| `app/settings.tsx` | `color: '#888'` | ✅ OK | ❌ Low contrast on light bg |
| `app/work-orders/index.tsx` | `color: '#888'` | ✅ OK | ❌ Low contrast |
| `components/OrbSheet.tsx` | Backdrop color | Check | Check |
| `app/orbswipe.tsx` | Multiple inline grays | Check | ❌ Several |
| `app/partner/dashboard.tsx` | Chart axis labels | Check | ❌ Some hardcoded light-mode-only |

### Light mode specific audit needed

Most of the app was designed dark-first. Light mode was added but several screens have:
- Dark gradients that look wrong on light theme (e.g., `LinearGradient` with dark stops)
- `colors.background` correctly mapped but inner cards using wrong surface color
- Icon colors not adjusted for light mode

**Most critical for Phase 1:**
- `app/auth/login.tsx` + `app/auth/signup.tsx` + `app/auth/onboarding.tsx` — these use `PREAUTH` theme which may not fully respect light/dark toggle
- `app/proof/[id].tsx` — the proof card has hardcoded dark styling (intentional for share, but background wrapper needs theme)

---

## Section 7: Performance Issues

### Re-render Hotspots

| Component | Issue | Fix |
|-----------|-------|-----|
| `app/(tabs)/index.tsx` | 12 context hooks at top level; re-renders on ANY context change | Memoize `filteredPartners` and event handlers; split contexts |
| `components/OrbTapMap.tsx` | Re-renders when any partner changes (array reference) | `useMemo` on partner pin data, stable callbacks |
| `components/OrbSwipeCardStack.tsx` | Card stack re-renders on every swipe due to array mutation | Use index-based state, not splice |
| `app/(tabs)/wallet.tsx` | Multiple `useEffect` chains causing cascade | Consolidate into single data-loading effect |
| `components/SearchOverlay.tsx` | ✅ FIXED (Phase 0) — Fuse.js memoized | OK |
| `context/WalletContext.tsx` | Balance refetch on every focus | Add 30s cache |

### Animation Performance

| Issue | File | Fix |
|-------|------|-----|
| `OrbSwipeCardStack` uses JS-thread gestures | `components/OrbSwipeCardStack.tsx` | Migrate to `react-native-reanimated` worklets |
| NavOrb `pulseScale` runs on every render | `components/NavOrb.tsx` | ✅ Already on worklet — OK |
| `withRepeat` animation cleanup missing | Multiple files | Add cleanup in `useEffect` return |
| FlatList missing `keyExtractor` prop | Some list screens | Add stable key |
| Image not lazy-loaded | `PartnerGridCard.tsx` | Already uses `OptimizedImage` — check it lazy-loads |

---

## Section 8: Accessibility Failures

| Issue | Files | Fix |
|-------|-------|-----|
| Tap targets < 44pt | Several icon-only buttons | Add `hitSlop={12}` or `minHeight: 44` |
| Missing `accessibilityLabel` | Most `TouchableOpacity` | Add to all interactive elements |
| Missing `accessibilityRole` | All buttons | Add `accessibilityRole="button"` |
| No reduced-motion guard on heavy animations | Scan success, onboarding | Check `ReduceMotionContext` / `useReduceMotion` hook |
| Color-only status indicators | Work order status dots | Add text label alongside color |
| `TextInput` missing `accessibilityLabel` | Auth screens, search | Add label |

---

## Section 9: Navigation & Dead-End Audit

| Screen | Dead End Issue | Fix |
|--------|---------------|-----|
| `app/proof/[id].tsx` | No "Go back to Map" CTA at bottom | Add "Explore More" → `/(tabs)` |
| `app/scan/success.tsx` | "Next Mission" only shows if missions active | Always show suggested next action |
| `app/orbsignal/[id].tsx` | "Back" only — no "see more markets" | Add "More Markets →" link |
| `app/inventory.tsx` | No link to "Earn more power-ups" | Add "→ See how to earn" |
| `app/achievements.tsx` | Earned badge detail modal has no share CTA | Add share button |
| `app/spheres/[id].tsx` | After pool contribution, no "invite friends to earn more" | Add post-action suggestion |
| `app/opportunities/my-applications.tsx` | Empty state has no "Browse opportunities" CTA | Add CTA |
| `app/tonight.tsx` | Empty state (no open partners) needs better fallback | Add "Try Grid view" or "See OrbSwipe" |

---

## Section 10: NavOrb — Current State vs Requirements

### Current State (`components/NavOrb.tsx`)
- ✅ Pulse ring animation (breathing effect)
- ✅ Spring scale on press/release
- ✅ Haptic on press (`selectionAsync`)
- ✅ Long-press → Scan shortcut
- ✅ Gold gradient when focused
- ❌ **No "swirl" effect** — just a static gradient + pulse ring
- ❌ **No color drift** — gradient stops are fixed (`COLORS.gold` or `['#333', '#111']`)
- ❌ **Feels flat** — the orb doesn't look truly 3D; no inner depth/glow
- ❌ **Flash icon** inside is generic — doesn't feel "mystical"

### Required Upgrades (Phase 5, locked)
1. **Swirl**: Use `react-native-reanimated` + `LinearGradient` angle rotation to simulate swirling energy. Implementation: animate `start`/`end` props of gradient in a slow loop (6-8s period) using `withRepeat(withTiming())`. Add a second gradient layer with slight offset and different opacity.
2. **Color drift**: Slow interpolation between gold → slightly amber → slightly rose-gold over 12s period. Not obvious but perceptible.
3. **3D depth**: Add an inner `LinearGradient` highlight (top-left white `rgba(255,255,255,0.3)` → transparent) to simulate a spherical light reflection.
4. **Better icon**: Replace `flash` with OrbTapLogoMark SVG or a custom sphere mark. Or remove icon — let the gradient ORB speak for itself.
5. **Pulse ring**: Current pulse ring uses `neonBlue` — when focused, switch to gold with wider spread.

---

## Section 11: Missing Core Components (Build in Phase 1)

These components are needed but don't exist or exist as scattered inline code:

| Component | Purpose | Why Needed |
|-----------|---------|------------|
| `<OrbButton />` | Universal button (primary/secondary/ghost/destructive) | Replace 5+ button patterns |
| `<OrbCard />` | Universal card (default/glass/elevated/hero) | Replace 7+ card patterns |
| `<OrbSectionHeader />` | Standardized section header | Replace 5+ header styles |
| `<OrbEmptyState />` | Standardized empty state | Replace inline text-only empty states |
| `<OrbSkeleton />` | Standardized loading skeleton | Several screens flash blank during load |
| `<OrbToast />` | Banner/toast notification | Currently using Alert or nothing |
| `<OrbDivider />` | Consistent horizontal divider | Scattered `borderBottomWidth: 1` everywhere |
| `<OrbBadge />` | Unified tier/status badge | Multiple competing badge components |
| `<OrbScreenHeader />` | Top bar for non-tab screens | Inconsistent back button + title placement |

---

## Section 12: Overall Scoring

| Category | Score | Priority |
|----------|-------|---------|
| Token adoption | 6/10 | P1 |
| Dark/Light readability | 7/10 | P1 |
| Component consistency | 5/10 | P1 |
| Navigation clarity | 7/10 | P1 |
| Performance | 7/10 | P2 |
| Accessibility | 4/10 | P1 |
| Animation quality | 7/10 | P2 |
| NavOrb quality | 6/10 | P2 (Phase 5 locked) |
| **Overall** | **6.1/10** | |

**Target after Phase 1-2: 8.5+/10 across all categories.**
