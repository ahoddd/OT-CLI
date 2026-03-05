# OrbBounty™ — Phase 1 discovery

- **Navigation**: Expo Router; routes under `app/`. Non-tab routes like work-orders, opportunities, feed. Add `app/bounty/` for OrbBounty.
- **Shell**: `ScreenWrapper` (title, headerLeft/Right); `SafeAreaView`; `useTheme()` (colors, isDark); `COLORS` from constants/Colors.
- **Backend**: Firebase Callable Functions (getFunctions(auth.app, 'us-central1'), httpsCallable). No REST/Express in repo.
- **Feature flags**: `constants/Flags.ts` DEFAULT_FLAGS; `constants/AdminConfig.ts` FLAG_LABELS, TAB_IDS, TAB_LABELS, TAB_ICONS, QUICK_ACTION_KEYS, DIRECTORY_ORDER, DIRECTORY_LABELS_DEFAULT, isPageVisible(). Add `isOrbBountyEnabled`.
- **Partner**: Work orders use `partnerId === uid` (listWorkOrders partner role). So partner = user with partners/{uid} (doc id = uid). Spec: "user as partner if partners/{uid} with role=partner".
- **Firestore**: Client reads partners, perks; writes via callables. Backend-only: workOrders, verifiedActions, etc. Add bounties, bids, orbtapConfig/orbBounty, partners/{id}/bountySettings — all backend write; client read bounties/bids where allowed or via callables.
- **Share**: ShareToSocialSheet + SharePayload (message, url, title, imageUri). AppLinks: partnerDeepLink, feedPostDeepLink, proofDeepLink pattern.
- **Admin**: app/admin/index.tsx section-based (flags, layout, system, etc.). Add OrbBounty section + delete-any bounty control.
- **Deep links**: app/_layout.tsx Stack; useLocalSearchParams for [id]. Add route app/bounty/[id].tsx; deep link bounty/:id → BountyDetail.
