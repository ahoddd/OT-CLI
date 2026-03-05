# OrbIntent™ Protocol + Auto-Deal Agent — Phase 1 Discovery

- **Navigation**: Expo Router; routes under `app/`. Add `app/intent/` for OrbIntent (home, create, [id], offer, locked, verify, deal, rules).
- **Shell**: ScreenWrapper (title, headerLeft/headerRight); SafeAreaView; useTheme() (colors, isDark); COLORS from constants/Colors. TriDock-safe per existing patterns.
- **Backend**: Firebase Callable Functions only (getFunctions(auth.app, 'us-central1'), httpsCallable). No REST in repo. Spec’s “POST /v1/intent/create” etc. map to callables: intentCreate, intentGet, intentFeed, intentOffer, intentAcceptOffer, intentVerifyFulfillment, ruleCreate, ruleUpdate, ruleList, ruleRunNow, adminOrbIntentMetrics, adminOrbIntentUpdateConfig.
- **Feature flags**: constants/Flags.ts DEFAULT_FLAGS; constants/AdminConfig.ts FLAG_LABELS, TAB_IDS, DIRECTORY_ORDER. Add isOrbIntentEnabled.
- **Admin**: app/admin/index.tsx section-based. Add “OrbIntent Control Center” section (tabs: Global Toggles, Thresholds, Quotas & Rules, Partner Controls, Observability). Admin = isAdminEmail(user?.email) from constants/Admin.ts.
- **Partner**: partners/{uid} doc; partnerId === uid. Same as OrbBounty/work orders. Partner role checked in callables via isPartner(uid).
- **Tier**: Custom claims (token?.premium, token?.pro) → free | premium | pro. getUserTier() pattern from orbBounty.ts.
- **Firestore**: Backend-only writes for intents, offers, rules, dealDoneCards, orbIntentEvents, orbtapConfig/orbIntent, partners/{id}/intentSettings. Client reads via callables only.
- **Share**: ShareToSocialSheet + payload (message, url, title). AppLinks: add intentDeepLink(intentId), dealDoneDeepLink(cardId).
- **Deep links**: app://intent/:id → app/intent/[id].tsx; app://deal/:cardId → app/intent/deal/[cardId].tsx (or app/deal/[cardId].tsx).
- **Audit**: orbIntentEvents/{autoId} append-only; type, intentId, actorUid, partnerId?, metadata.
- **Rule engine**: Scheduled execution via Cloud Scheduler + callable stub or scheduled function; cooldown and max rules per tier enforced in callables.
