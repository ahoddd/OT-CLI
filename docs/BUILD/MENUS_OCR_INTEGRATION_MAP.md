# Menu OCR Integration Map (Phase 0 — Discovery)

**Scope:** Partner Menu OCR → Structured Menu → Publish + Conversion hooks only. No navigation rewrite, no unrelated screens.

---

## 1. Partner profile / page (where menu will display)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Partner public page | `app/partner/[id].tsx` | Add "Menu" section above "DEALS & PERKS"; show Verified Menu badge; "Report an issue" for menu; Tonight Picks carousel when flag on. |

---

## 2. Partner admin / editor (entry for Upload Menu)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Partner dashboard | `app/partner/dashboard.tsx` | Add "Manage Menu" section (same pattern as Commerce Feed / OrbOpportunities / OrbVote). Entry: `router.push('/partner/menu' as any)` or `/partner/menu/upload`. |
| Partner menu management (new) | `app/partner/menu/` (new) | New route(s): upload flow, review editor, version history. Reuse dashboard card/settingRow styles. |

---

## 3. Image upload / storage (reuse pattern)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Firebase Storage upload | `services/uploadPostImage.ts` | `ref`, `uploadBytes`, `getDownloadURL` from `firebase/storage`; `storage` from `firebaseConfig.ts`. Pattern: `posts/{partnerId}/{postId}_{index}_{ts}.{ext}`. |
| Config | `firebaseConfig.ts` | `getStorage(app)`, `storageBucket`. |
| New menu uploads | New: `services/uploadMenuImage.ts` (or extend uploadPostImage) | Store under e.g. `menus/{partnerId}/{menuId}_{versionId}_{index}_{ts}.jpg` for menu photos. Reuse same fetch→blob→uploadBytes→getDownloadURL. |

---

## 4. Feature flags + admin config

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Default flags | `constants/Flags.ts` | Add `partnerMenusEnabled`, `partnerMenusOcrOnDevice`, `partnerMenusOcrCloudFallback`, `partnerMenusReporting`, `partnerMenusTonightPicks`, `partnerMenusDropSuggestions` (all boolean). |
| Flag context | `components/FlagContext.tsx` | Reads `DEFAULT_FLAGS`; mergeWithDefaults; no code change needed if new keys added to `DEFAULT_FLAGS` and `FeatureFlags` type. |
| Usage | Any screen | `const { flags } = useFlags(); flags.partnerMenusEnabled` etc. Hide menu UI when off. |
| Admin hub | `app/admin/index.tsx` | Add "Menus needing review" in a suitable section (e.g. system or new "Menus" subsection). List partnerId, report count, last report; view-only or mark resolved. |

---

## 5. Existing “posts” / catalog patterns (reuse)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Partner create post | `app/partner/posts/create.tsx` | Multi-image picker, `uploadPostImage(uri, partnerId, postId, index)`, then navigate. Reuse for menu photo capture flow (capture → upload → then run OCR on local/uploaded assets). |
| Image picker | `expo-image-picker` | Already used in admin, partner/posts/create, EditProfileSheet. Use `launchCameraAsync` / `launchImageLibraryAsync` for menu photos. |
| Drops (catalog) | `constants/Drops.ts`, `hooks/useDrops.ts` | Drop type: partnerId, title, description, category, tier, startAt, endAt, qtyTotal, qtyRemaining. No "create drop" UI in app; only reserve/redeem. So "Create Drop from item" → prefill draft (new minimal screen or modal) or store DropSuggestionDraft and "Coming soon" publish. |

---

## 6. Tonight / Pulse (Tonight Picks source)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Tonight screen | `app/tonight.tsx` | Uses `usePulse().tonightPicks` (partners + drops). Extend Pulse to include "menu tonight picks" from partner menus when `partnerMenusTonightPicks` on: either extend `usePulse` to merge menu tonight-pick items (partnerId + item name) as tiles, or keep Tonight as-is and only show Tonight Picks on partner page + map sheet. Per prompt: "If Tonight engine does not exist yet: implement minimal Tonight Picks module only on partner page and map sheet." Tonight exists → add lightweight query in usePulse or a small hook that fetches menu items with featuredTonight from menus store and merges into tonightPicks. |
| Pulse hook | `hooks/usePulse.ts` | `tonightPicks` built from `tonightPicksPartners` (verified actions) + `trendingDropsNow`. Add optional merge with menu tonight picks from partner menus (by partnerId). |

---

## 7. Screens to add (minimal, no drift)

| Screen / route | Path | Purpose |
|----------------|------|--------|
| Partner menu root | `app/partner/menu/index.tsx` | List: current menu status, "Upload / Edit Menu", version history. Navigate to upload or editor. |
| Upload / capture | `app/partner/menu/upload.tsx` | Up to 6 photos, reuse upload pattern, run OCR, then navigate to review editor with draft version. |
| Review editor | `app/partner/menu/edit.tsx` | Edit sections/items, reorder, prices, tags, Tonight Pick, Drop suggestion; Publish. |
| Version history | In `app/partner/menu/index.tsx` or `app/partner/menu/versions.tsx` | List prior versions (date, summary); view-only or restore. |
| Report menu issue | Modal or `app/partner/menu/report.tsx` | Category, details ≥10 chars; write MenuReport. Can be modal from partner page. |
| Admin menus review | `app/admin/index.tsx` (new subsection) | List menus with status NEEDS_REVIEW (partnerId, report count, last report). |

---

## 8. Data persistence (local-first, no new backend)

| Data | Location | Notes |
|------|----------|--------|
| Menu documents + versions | AsyncStorage (new key e.g. `ORBTAP_PARTNER_MENUS_V1`) or context + AsyncStorage | Same pattern as `MissionsContext`, `useDrops`, `BookmarkContext`: in-memory state + persist. Types in `constants/PartnerMenu.ts` (new). |
| Menu reports | AsyncStorage `ORBTAP_MENU_REPORTS_V1` | List of MenuReport; auto-flag NEEDS_REVIEW when thresholds met. |
| Drop suggestion drafts | AsyncStorage `ORBTAP_DROP_SUGGESTION_DRAFTS_V1` | Minimal: partnerId, menuItemId, title, description; "Coming soon" publish if no drop-create UI. |

---

## 9. OCR pipeline (on-device first)

| Step | Approach | Notes |
|------|----------|--------|
| Capture | `expo-image-picker` (existing) | Same as partner posts: up to 6 images. |
| On-device OCR | **New dependency:** React Native library for Vision (iOS) / ML Kit (Android) | Repo has no OCR today. Options: `react-native-vision-camera` + plugin, or `@react-native-ml-kit/text-recognition`, or Expo module if available. Implement in `services/ocrMenu.ts` or `utils/ocr.ts`; gate by `partnerMenusOcrOnDevice`. |
| Confidence | Heuristic in code | Ratio of recognized chars, price-like patterns, low garbage; threshold 0.55. |
| Cloud fallback | Feature-flagged, OFF by default | `partnerMenusOcrCloudFallback`; isolate in same OCR module; only if confidence &lt; 0.55 or parse fails. |
| Parsing | Deterministic heuristics in TS | Section headers (ALL CAPS, no price), item lines (price patterns), combine following lines as description. Output draft MenuVersion. |

---

## 10. File paths summary (reuse only)

- **Partner page (display menu):** `app/partner/[id].tsx`
- **Partner dashboard (entry):** `app/partner/dashboard.tsx`
- **Upload pattern:** `services/uploadPostImage.ts`, `firebaseConfig.ts`
- **Flags:** `constants/Flags.ts`, `components/FlagContext.tsx`
- **Admin hub:** `app/admin/index.tsx`
- **Tonight:** `app/tonight.tsx`, `hooks/usePulse.ts`
- **Drops types:** `constants/Drops.ts`, `hooks/useDrops.ts`
- **Partner posts (multi-image):** `app/partner/posts/create.tsx`
- **Report (existing):** `app/report.tsx` (general); menu report can be modal or new small screen.

---

## 11. Platform OCR constraints (to handle in implementation)

- **iOS:** Vision framework (VNRecognizeTextRequest) is on-device and free. Via React Native we need a bridge or a library (e.g. `react-native-vision-camera` with text recognition plugin, or community package). Expo: may require dev client / config plugin for native OCR.
- **Android:** ML Kit Text Recognition is on-device and free. Same: RN library or Expo module.
- **Fallback:** If we cannot add a native OCR dependency without breaking the build, implement a **manual entry** path: partner can type/paste menu text and we parse it (same heuristics); `ocrEngine: 'MANUAL'`. Cloud OCR remains off by default and gated.

---

*Integration Map complete. Implementation proceeds in phases 1–6 per prompt.*
