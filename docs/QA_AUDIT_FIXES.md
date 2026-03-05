# QA Audit — Fixes Applied

Summary of bugs and type errors fixed across the repo. **TypeScript now passes (`npx tsc --noEmit`).**

## TypeScript & type safety

- **Theme `primary`** — Added `primary` to `constants/Colors.ts` (dark/light) and used where `colors.primary` was referenced (tabs index, signup, MasterDirectory).
- **WalletContext** — Exported `useWallet` as alias for `useWalletContext` so `app/achievements.tsx` and any other consumers keep working.
- **Admin invite result** — Admin hub now narrows invite result before using `res.message`: `!res.success ? res.message : 'Failed to create link'`.
- **CreateInviteLinkResult** — Same pattern: only access `message` when `success` is false.
- **useWorkOrders** — `res.message` only used when `!res.success && 'message' in res`.
- **Feed post detail** — Post state type updated to `OrbPost | null | undefined` so initial `undefined` is valid.
- **Share payload types** — Added `url?: string` to share state in arena/entry `[id].tsx`, orbsignal `[id].tsx` and `index.tsx`, OrbScopeCard, PollCard.
- **Missions** — Fixed duplicate `firstPartnerId` (renamed second to `firstIdForAnalytics`), added `getPartner` from `usePartners()`, fixed OTPointsBadge `label` to `"ot"` (lowercase) per type.
- **usePulse** — Defined `getPartnerName` / `getPartnerCategory` inside the `tonightPicks` useMemo and included `getPartner` in the dependency array.
- **AdminConfig** — Added missing `imageContentModerationEnabled` to `FLAG_LABELS` to satisfy `Record<FlagKey, string>`.
- **Location permissions (OrbTapMap / OrbTapMapFallback)** — Stopped comparing full `LocationPermissionResponse` to string; use `perm = await getForegroundPermissionsAsync()` and check `perm.status !== 'granted'` / `perm.status === 'denied'`.
- **OrbTapMapFallback mapType** — Replaced unsupported `'muted'` with `'standard'` for `MapType`.
- **Notifications screen** — Replaced numeric haptic args with `Haptics.ImpactFeedbackStyle.Medium` and `Haptics.NotificationFeedbackType.Success`, and imported `Haptics` from `safeHaptics`.
- **Push notification handler** — Implemented full `NotificationBehavior`: added `shouldShowBanner: true` and `shouldShowList: true` in `services/pushNotifications.ts`.
- **uploadBroadcastImage** — Replaced `FileSystem.EncodingType.Base64` with string `'base64'` (EncodingType may not be exported in current expo-file-system).
- **PerkGridModal** — Removed duplicate style key `frontContent` (second occurrence).
- **PollCard / orbsignal index** — Animated width: use template string `` `${barWidth.value * 100}%` `` instead of `+ '%' as const` to satisfy `DimensionValue`.
- **upgrades.tsx / PremiumCard.tsx** — Percentage width cast to `DimensionValue` for strict ViewStyle.
- **LandingVideoBackground** — Replaced `Platform.select` with `Platform.OS === 'web'` and cast web-only style arrays to `StyleProp<ViewStyle>` (vw/vh and objectFit are web-only).

## Optional follow-ups (completed)

- **Console gating** — All app-side `console.log`/`warn`/`error` (contexts, hooks, services, components) are now wrapped with `if (__DEV__)` so they only run in development. Server-side `functions/src` was left unchanged. A shared `utils/logger.ts` was added for future use.
- **Accessibility** — Added `accessibilityLabel` and `accessibilityRole` on key flows: login (back, Sign in, Remember me, biometric, signup link), scan (Request Permission, DEV simulate), missions (back, plan cards), home tab (search, Pulse, map/grid toggle, filter, See all partners, Open directory). Tab bar and TabBarOrb already had a11y.
- **Error boundaries** — RootErrorBoundary and MapErrorBoundary now gate their `console.error`/`warn` with `__DEV__`.
- **Null-safety** — Spot-checked `getPartner` usage: partner/[id], bookmarks, and wallet already use optional chaining or early return; no changes needed.

## Missions redeclaration fix

- **`app/missions.tsx`** — Removed duplicate `const firstPartnerId` in `handleCompleteMission`; reuse the existing `firstPartnerId` for the analytics call so Babel no longer reports "Identifier 'firstPartnerId' has already been declared".

---

*Audit date: 2026-02-16. Run `npx tsc --noEmit` to confirm zero type errors.*
