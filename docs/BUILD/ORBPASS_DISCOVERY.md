# OrbPass™ — Phase 1 Discovery Report

## Tier sources
- **OrbBounty (functions)**: getUserTier() from context.auth.token — premium === true → premium, pro === true || partner === true → pro, else free.
- **PreferencesContext**: premiumMember (boolean) — local pref; not the source of truth for backend.
- **AdminConfig**: TAB_IDS / QUICK_ACTION_CONFIG include 'premium'; route `/(tabs)/premium`, label Premium. No central “getUserTierAndEntitlements” in app; backend uses token claims.
- **Conclusion**: Tier = custom claims (premium, pro). Free = no claim or falsy. Implement getOrbPassEligibility(uid, token) in backend reading orbtapConfig/orbPass.tiersEnabled[tier]. App can read tier from auth token if exposed, or call GET config callable that returns { config, userTier, eligible }.

## Entitlement check method
- Backend: read context.auth.token.premium / .pro; map to 'free'|'premium'|'pro'; check config.tiersEnabled[tier] && config.enabled && (citiesEnabled empty or user city in list).
- App: call orbPassGetConfig (or similar) which returns config + eligibility for current user; show upgrade CTA when !eligible using existing premium/compare-accounts route.

## Existing OrbPass state
- **Present**: constants/Flags.ts isOrbPassEnabled; constants/AdminConfig.ts FLAG_LABELS isOrbPassEnabled. constants/Drops.ts orbPassLevelRequired (optional).
- **Absent**: No Firestore collections (orbPassRedemptions, orbPassPartnerLedger, orbPassEvents, orbtapConfig/orbPass). No backend endpoints. No app screens. No Admin Control Center.
- **Proposed**: Add all per spec; wire eligibility to existing tier (token claims); upgrade CTA → existing premium/compare flow.

## Minimal integration points
- Flags: keep isOrbPassEnabled; add to Admin Hub OrbPass section.
- Config: orbtapConfig/orbPass (single doc) created/updated by admin callable; read by all OrbPass callables.
- Tiers: Use same getUserTier() pattern as orbBounty (token.premium, token.pro) and add any tier keys found in config.tiersEnabled (free, premium, pro).
- Routes: app/premium, app/compare-accounts (existing); add app/orbpass/ (home, offer/[id], redeem, history, partner inbox, partner verify, share card).
- MasterDirectory: add OrbPass item when isOrbPassEnabled; link to /orbpass or similar.
