# OrbSwipe Test Checklist

## Base

- [ ] **Route** — `/orbswipe` opens without 404; back returns to previous screen.
- [ ] **Partner route** — `/partner/orbswipe` opens for partner accounts; redirects for non-partners.
- [ ] **Flags** — When `isOrbSwipeEnabled` is OFF, OrbSwipe is hidden from directory, Orb hub, search, and partner dashboard. No dead routes when other v1.1 flags are OFF.

## Admin name

- [ ] **Names** — Admin Hub → Product → Names. “Directory: OrbSwipe” and “Screen: OrbSwipe page title” exist.
- [ ] **Rename** — Change “Screen: OrbSwipe page title” to a custom value (e.g. “Swipe”). Confirm:
  - `/orbswipe` screen header shows the new name.
  - Orb hub Discover tile shows “[New name] Tonight”.
  - Partner dashboard “OrbSwipe Cockpit” row shows “[New name] Cockpit”.
- [ ] **Directory label** — Change “Directory: OrbSwipe”; confirm Master Directory and All Pages grid show the new label.

## v1.1 User controls (Phase A)

- [ ] **Tune** — Options icon on OrbSwipe header opens Tune sheet (when `isOrbSwipeV11ControlsEnabled`).
- [ ] **Radius** — Select 1 / 5 / 10 / 15 mi; persist and use in deck composition when implemented.
- [ ] **Indoor only** — Toggle persists.
- [ ] **Hide categories** — Select one or more; persist. Deck filters by hidden categories when implemented.
- [ ] **Show fewer sponsored** — Shown only when user has paid tier (e.g. premiumMember); toggle persists.

## Tonight Recap (Phase B)

- [ ] **Recap** — When Fuse is completed with at least one verified step, Tonight Recap can be shown (e.g. via Fuse flow or test state).
- [ ] **Share** — Share button opens share sheet with message and `orbswipeDeepLink()` URL.

## Low supply (Phase C)

- [ ] **Banner** — When deck count &lt; 8 (or mock low supply), “Few picks right now” banner appears with Expand radius, Indoor / filters, Map picks.
- [ ] **Expand radius** — Tapping updates radius to next preset and can open Tune.
- [ ] **Map picks** — Navigates to map tab.

## Partner Swipe Studio (Phase D)

- [ ] **Cockpit entry** — Partner dashboard shows “OrbSwipe Cockpit” row when `isOrbSwipeEnabled`; tap goes to `/partner/orbswipe`.
- [ ] **Pro panel** — For Pro (Platinum) partners with `isOrbSwipePartnerSwipeStudioEnabled`, “Swipe Studio” panel is visible with suggestions and quick actions.
- [ ] **Free/Premium** — Swipe Studio panel is not shown for non-Pro partners.

## Fuse Engine Never Fails (Fortification A)

- [ ] **Flag** — `isOrbSwipeFuseNeverFailsEnabled` defaults ON. When OFF, empty deck shows old static empty state.
- [ ] **Zero supply** — With zero drops/missions, Fuse still offers fallback outcomes (verified partner / expand radius).
- [ ] **Outcomes render** — Empty deck shows Fuse outcome buttons with labels and sub-labels.
- [ ] **Expand radius** — "Retry with wider radius" works: updates radius and opens Tune.
- [ ] **Map picks** — "See top partners on map" navigates to map tab.
- [ ] **Single action** — If Fuse cannot produce a 2-stop plan, it offers best single action.

## Card Detail Sheet (Fortification B)

- [ ] **Flag** — `isOrbSwipeCardDetailSheetEnabled` defaults ON. When OFF, swipe-up navigates directly.
- [ ] **Opens on swipe-up** — Swiping up on a card opens the detail bottom sheet (not navigating away).
- [ ] **Content** — Sheet shows: partner name, verified badge, tier, distance, scarcity, value summary, description, why label.
- [ ] **Primary CTA** — Drop shows "Reserve", Mission shows "Start", Partner shows "Navigate". Tap navigates with `from=orbswipe`.
- [ ] **Secondary actions** — Save, Add to Tray, Show on Map all work.
- [ ] **Save creates intent** — Tapping Save creates a SavedIntent when `isOrbSwipeSavedIntentsEnabled` is ON.

## SavedIntent Pipeline (Fortification C)

- [ ] **Flag** — `isOrbSwipeSavedIntentsEnabled` defaults ON. When OFF, swipe-right does not create intents, modules hidden.
- [ ] **Right swipe creates intent** — Swiping right creates a SavedIntent (check AsyncStorage or module).
- [ ] **Idempotent** — Swiping right on same card twice within 24h does not create duplicate.
- [ ] **Home module** — "Saved for Tonight" module appears on home screen (map view) with up to 3 intents.
- [ ] **Wallet module** — "Saved for Tonight" module appears in wallet before "Earn More" section.
- [ ] **Tap navigates** — Tapping an intent navigates to the correct route (drop/mission/partner).
- [ ] **Remove** — X button removes intent from the list.
- [ ] **Completed** — After verified win at a partner, matching intent is marked COMPLETED.
- [ ] **Expiry** — Intents expire after 7 days (configurable via `SAVED_INTENT_EXPIRY_DAYS`).

## Friend Passes (Fortification D)

- [ ] **Flag** — `isOrbSwipeFriendPassesEnabled` defaults ON. When OFF, FriendPassOffer not shown.
- [ ] **Offer appears** — After OrbSwipe-origin verified win, "Send a Friend Pass" card appears in scan success.
- [ ] **Dismiss** — X button dismisses the offer.
- [ ] **Create** — "Create Friend Pass" generates a pass and opens share sheet with deep link.
- [ ] **Rate limit** — Max 5 passes per week enforced (error message shown if exceeded).
- [ ] **Same user block** — Creator cannot claim their own pass.
- [ ] **Expiry** — Pass expires after 48 hours (configurable via `FRIEND_PASS_EXPIRY_HOURS`).
- [ ] **Ledger reasons** — `EMIT_FRIEND_PASS_FRIEND_BONUS` and `EMIT_FRIEND_PASS_CREATOR_BONUS` exist in OrbinomicsPolicy.

## Partner Growth Suggestions (Fortification E)

- [ ] **Flag** — `isOrbSwipePartnerGrowthSuggestionsEnabled` defaults ON. When OFF, panel hidden.
- [ ] **Pro panel** — Platinum (Pro) partner sees full Growth Suggestions panel (up to 4 suggestions).
- [ ] **Premium tip** — Gold (Premium) partner sees "Tip of the week" (1 suggestion).
- [ ] **Free hidden** — Silver (Free) partner sees no suggestions.
- [ ] **Content** — Suggestions show: title, detail, one-tap action button.
- [ ] **Actions** — Action buttons show alert with "coming soon" for create/schedule/duplicate.
- [ ] **Data-driven** — Suggestions are deterministic based on OrbSwipe analytics events.

## Stability

- [ ] **Build** — `npx tsc --noEmit` passes.
- [ ] **No new TS errors** — OrbSwipe-related files introduce no new TypeScript errors.
- [ ] **No dead routes** — All routes referenced in fortifications exist and render.
- [ ] **App boots** — App boots without blank screen after fortification changes.
