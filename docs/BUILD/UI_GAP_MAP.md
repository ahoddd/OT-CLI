# OrbTap — UI Gap Map (Phase 0)

**Purpose:** Single source of truth for UI version toggle + theme + Kit v1 migration.  
**Scope lock:** UI only; no business logic, routing, or data model changes except where required for UI switching.

---

## 1) Blueprint read confirmation

| Doc | Path | Constraints used |
|-----|------|------------------|
| Master Blueprint | `OrbTap_Master_Blueprint.md` | Allowed paths: `app/`, `app/(tabs)/`, `app/admin/`, `components/`, `constants/`, `assets/`, `docs/BUILD/`, `./`. No new folders outside these. Nightglass design; membership tiers Silver/Gold/Legendary only. One canonical OrbSheet; ScreenWrapper everywhere. |
| Routes | `docs/BUILD/ROUTES_MAP.md` | Core routes for migration identified below. |
| Flags | `docs/BUILD/FLAGS_MAP.md` | Flags in `constants/Flags.ts`; Admin Hub uses `useFlags` from `FlagContext`. |
| Phase status | `docs/BUILD/PHASE_STATUS.md` | Admin Hub has flags + audit; no existing UI version. |

---

## 2) Existing theme / tokens / materials

| What | File path(s) | Notes |
|------|--------------|--------|
| **Theme hook** | `hooks/useTheme.ts` | Uses `useColorScheme` + `PreferencesContext` (`themePreference`: light \| dark \| system). Returns `isDark`, `colors`, `rawColors`, `themePreference`. No `uiVersion`; single palette. |
| **Color palette** | `constants/Colors.ts` | `COLORS.dark`, `COLORS.light` (background, surface, surfaceHighlight, text, textSecondary, border, cardBorder, gloss, shadow, tabBar, navIcon, navIconActive, primary). No semantic tokens (e.g. surface1/2/3, accentPrimary), no materials (Nightglass/Lightglass). |
| **Design tokens** | `constants/DesignTokens.ts` | `SPACE`, `RADIUS`, `MOTION`, `ELEVATION`, `TAP_TARGET_MIN`, `CARD_PADDING`, `SCREEN_PADDING_H`, `SECTION_TITLE`. No color tokens; spacing/radius/motion only. |
| **Materials** | — | None. No Nightglass/Lightglass as named surfaces. |
| **useTheme consumers** | 70+ files in `app/` and `components/` | All use `colors` from `useTheme()`; many also use `COLORS` (e.g. `COLORS.danger`, `COLORS.gold`) or hardcoded hex. |

**Gap:** No single token system that accepts both `colorMode` and `uiVersion`. No glass materials. Classic palette exists but is not behind a “skin”; Kit v1 tokens do not exist. **Membership tiers:** Use 3-tier (Silver/Gold/Legendary) for membership badges as separate membership tokens (not rarity tiers) so blueprint tier-color constraint is not violated.

---

## 3) Admin Hub and config/flags patterns

| What | File path(s) | Notes |
|------|--------------|--------|
| **Admin Hub screen** | `app/admin/index.tsx` | Large component; uses `useFlags()`, `useTheme()`, `useAdminLayout()`, `AdminConfig` constants. Sections: flags, layout, names, tutorials, onboarding, partners, featured, users, invite, content, orbsignal, badges, broadcast, push, system, orbbounty, orbintent, orbpass, stampcards, sponsoredads, partnerapps, maintenance, appinfo. No “UI Version” section yet. |
| **Flag context** | `components/FlagContext.tsx` | `FlagProvider`; persistence: `AsyncStorage` keys `ORBTAP_FLAGS`, `ORBTAP_FLAGS_AUDIT`. API: `flags`, `setFlag(key, value)`, `resetFlags()`, `auditLog`. Audit entries: `{ key, value, timestamp }`. |
| **Flags definition** | `constants/Flags.ts` | `DEFAULT_FLAGS`, types `FeatureFlags`, `FlagKey`, `FlagValue`, `MapProvider`. No `uiVersion` key. |
| **Admin layout config** | `constants/AdminConfig.ts` | Display names, tab order, directory order, etc. Layout state in AsyncStorage: `ORBTAP_ADMIN_LAYOUT_V1`. Load/save via async helpers in same file. |
| **Audit / integrity** | `constants/IntegrityEvent.ts`, `hooks/useIntegrity.ts` | IntegrityEvent for anomaly/audit (e.g. redeem bursts). Admin shows “Integrity events” panel. Flag changes are audited in `FlagContext` (not IntegrityEvent). For UIConfig, use same pattern as flags: dedicated audit log (e.g. `ORBTAP_UI_CONFIG_AUDIT`) or extend existing audit. |

**Theme module (Phase 2):** Single token system in `constants/Theme.ts`: `getThemeTokens(colorMode, uiVersion)`; `getSurfaceStyles`, `getTextStyles`, `getBorderStyles`. `useTheme()` now uses `useUIConfig()` and returns `tokens`, `surfaces`, `textStyles`, `borders`, `uiVersion` in addition to `colors`/`isDark`.

**Gap (pre-Phase 2):** Admin had no UI Version control. UIConfig (e.g. `uiVersion: 'classic' | 'kit_v1'`) can follow flags pattern: AsyncStorage + audit; optional later: Firestore app config doc for server-authoritative.

---

## 4) User preference storage (theme / dark–light)

| What | File path(s) | Notes |
|------|--------------|--------|
| **Preferences context** | `context/PreferencesContext.tsx` | `PREFS_KEY = 'ORBTAP_PREFS_V2'`. Preferences include `themePreference: 'light' | 'dark' | 'system'`. Persisted via AsyncStorage. |
| **Theme consumption** | `hooks/useTheme.ts` | Reads `prefs.themePreference`; resolves to `effectiveDark` and returns `colors` from `COLORS.dark` or `COLORS.light`. |

**Gap:** None for dark/light. `uiVersion` will be admin-only (not in Preferences unless blueprint adds a dev override behind a flag).

---

## 5) Core screens/routes for launch polish (exact paths)

| Screen | Route(s) | File path(s) |
|--------|----------|--------------|
| **Auth** | `/auth/login`, `/auth/signup` | `app/auth/login.tsx`, `app/auth/signup.tsx` |
| **Home** | Default tab (map) | `app/(tabs)/index.tsx` |
| **Map** | Default tab is map; no separate `/map` route. Migrate map component(s) used on Home first (e.g. `components/OrbTapMap.tsx`). If a separate Map route is added later, include it in the migration list. | `app/(tabs)/index.tsx`, `components/OrbTapMap.tsx` |
| **Partner profile** | `/partner/[id]` | `app/partner/[id].tsx` |
| **Drops list** | No dedicated list route; drops surfaced on Map/Home and Wallet | `app/(tabs)/index.tsx` (drops in UI), `app/(tabs)/wallet.tsx` (ledger/receipts). If a dedicated “Drops list” screen is added later, it would be a new route. |
| **Drop detail** | `/drop/[id]` | `app/drop/[id].tsx` |
| **Wallet** | `/(tabs)/wallet` | `app/(tabs)/wallet.tsx` |
| **Proof receipt** | `/proof/[id]` | `app/proof/[id].tsx` |
| **Settings** | `/settings` | `app/settings.tsx` |
| **Partner dashboard landing** | `/partner/dashboard` | `app/partner/dashboard.tsx` |

---

## 6) Style anti-patterns (hardcoded colors / spacing / radius)

Scan: hex/rgba in `app/` and `components/` (TSX only).

**Hardcoded hex/rgba:**  
- **app/:** 90+ files with at least one match (e.g. `#...`, `rgba(`). High-offender files (many occurrences): `app/(tabs)/index.tsx`, `app/(tabs)/orb.tsx`, `app/missions.tsx`, `app/auth/login.tsx`, `app/auth/signup.tsx`, `app/admin/index.tsx`, `app/orbsignal/index.tsx`, `app/orbsignal/[id].tsx`, `app/spheres/index.tsx`, `app/partner/[id].tsx`, `app/partner/dashboard.tsx`, `app/settings.tsx`, `app/(tabs)/wallet.tsx`, `app/drop/[id].tsx`, `app/proof/[id].tsx`, `app/partner-apply.tsx`, `app/learn.tsx`, `app/compare-accounts.tsx`, `app/premium.tsx`, `app/features.tsx`, `app/pulse.tsx`, `app/feed/index.tsx`, plus many others.  
- **components/:** 55+ files with at least one match. High-offender: `components/AllPagesGridModal.tsx`, `components/MasterDirectory.tsx`, `components/DailyStreakOrb.tsx`, `components/OrbSheet.tsx`, `components/PollCard.tsx`, `components/PerkGridModal.tsx`, `components/PremiumCard.tsx`, `components/LandingCityStrip.tsx`, `components/MaintenanceGate.tsx`, `components/OrbTapMap.tsx`, `components/FlashDrop.tsx`, `components/GamificationUI.tsx`, `components/SphereXpBar.tsx`, `components/ProofCard.tsx`, `components/FeaturedPartnerCard.tsx`, `components/WebLandingPage.tsx`, plus others.

**Hardcoded borderRadius / padding / margin (numeric literals in styles):**  
- **app/:** 90+ files with at least one of `borderRadius: N`, `padding: N`, `margin: N`.  
- **components/:** 65+ files with at least one such usage.

**Allowlist for regression scan:**  
- Token/theme files: `constants/Colors.ts`, `constants/DesignTokens.ts`, and any new `constants/Theme*.ts` or `constants/UIConfig*.ts`.  
- Component library: e.g. `components/ui/` (if created for Kit v1 canonical components).

---

## 7) Summary — file paths for implementation

| Category | Paths |
|---------|--------|
| **Theme / tokens** | `hooks/useTheme.ts`, `constants/Colors.ts`, `constants/DesignTokens.ts`. New: single theme module (e.g. `constants/Theme.ts` or `theme/`) that takes `colorMode` + `uiVersion` and returns tokens + helpers. |
| **Admin config** | `app/admin/index.tsx`, `components/FlagContext.tsx`, `constants/Flags.ts`, `constants/AdminConfig.ts`. New: UIConfig schema + storage key (e.g. `ORBTAP_UI_CONFIG_V1`) and optional `ORBTAP_UI_CONFIG_AUDIT`; Admin Hub section “UI Version”. |
| **User prefs** | `context/PreferencesContext.tsx`, `hooks/usePreferences.ts`. No change for theme; `uiVersion` from UIConfig (admin), not prefs. |
| **Core screens to migrate** | `app/auth/login.tsx`, `app/auth/signup.tsx`, `app/(tabs)/index.tsx` (Home/Map), `app/partner/[id].tsx`, `app/drop/[id].tsx`, `app/(tabs)/wallet.tsx`, `app/proof/[id].tsx`, `app/settings.tsx`, `app/partner/dashboard.tsx`. |
| **Shared UI** | `components/ScreenWrapper.tsx`, `components/OrbSheet.tsx`. Use for wrappers and canonical Kit v1 components. |

---

**Next step:** Confirm this Gap Map. After confirmation, proceed to Phase 1 (Admin Hub UI version toggle with safe rollback).
