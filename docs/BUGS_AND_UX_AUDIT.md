# Bugs & UX Audit (Feb 2025)

## Bugs fixed

### 1. **Notification settings — empty catch**
- **File:** `app/notification-settings.tsx`
- **Issue:** Toggling the master “Push notifications” switch called the API; on failure the catch was empty, so the UI stayed “on” while the server state stayed “off,” with no feedback.
- **Fix:** On API failure, revert the toggle (context + local state) and show `Alert.alert('Couldn’t update', '...')`.

### 2. **OrbPass home — no error state**
- **File:** `app/orbpass/index.tsx`
- **Issue:** If `orbPassGetConfig()` or `orbPassEligibleOffers()` failed, the user saw loading then empty/stale content with no message.
- **Fix:** Added `error` state; on failure show inline error and a full-screen error + Retry when config never loaded; on refresh failure show error card at top of scroll.

### 3. **Intent (Deal Match) — Mine/Inbox/Rules tabs**
- **File:** `app/intent/index.tsx`
- **Issue:** Switching to Mine/Inbox/Rules had no loading indicator and failures didn’t set or show error.
- **Fix:** Added `tabLoading` and set `error` in `loadMine`/`loadInbox`/`loadRules` on failure; UI shows loading when switching tabs and displays error when a load fails.

---

## Lint & code scan

- **Linter:** No errors.
- **TODOs:** Only non-blocking (e.g. `pushNotifications.ts` Cloud Functions TODO, `Arena.ts` constant name `BEST_UNDER_10_HACK`).
- **Empty catch:** Only remaining empty catch is in `getNotificationPreferences` initial load (optional to show a toast or error state).
- **Console logs:** Multiple files still use `console.log`/`warn`/`error`; consider routing through `utils/logger.ts` and stripping in production.

---

## UX improvements (suggestions)

### Accessibility
- **Current:** Some components use `accessibilityLabel` / `accessibilityRole` (e.g. `PremiumCTAButton`, `ShareToSocialSheet`, `OrbTapMapFallback`, login, scan).
- **Suggestion:** Add `accessibilityLabel="Back"` and, where needed, `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` to header back buttons and other small tap targets for consistency and screen-reader support.

### Touch targets
- **Suggestion:** Ensure icon-only buttons (e.g. back, close, tab bar) have at least 44pt touch area (padding or `hitSlop`). Some headers already use this pattern.

### Error feedback
- **Current:** Many flows use `Alert.alert()` for errors; list screens show inline error text.
- **Suggestion:** Consider a shared toast/snackbar for non-blocking errors (e.g. “Preferences saved”) to avoid alert fatigue.

### Consistency
- **Colors:** Most screens use `COLORS.neonBlue?.[0] ?? fallback`; a few use `COLORS.neonBlue[0]` (e.g. `people.tsx`, `profile.tsx`). `COLORS` is stable; optional chaining is optional but keeps future refactors safe.
- **Loading copy:** “Loading…” is consistent; consider a single `<LoadingView />` component for reuse.

### Deprecations (Firebase / Node)
- **Functions:** Runtime Node.js 20 deprecation and `functions.config()` → params migration (see Firebase CLI output) are for later planning, not immediate bugs.

---

## Summary

- **3 bugs fixed:** notification-settings push toggle, OrbPass error handling, Intent tab loading/error.
- **No new linter issues.** Remaining suggestions are incremental UX (a11y, touch targets, toasts, consistency).
