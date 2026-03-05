# Daily Orb Ritual + Badges — Manual Test Checklist

## 1) Orb tap → break → points reveal

- [ ] Open Orb tab. Daily Ritual section shows orb with "TAP 3× TO BREAK".
- [ ] Tap once: progress shows "2 of 3", crack visible.
- [ ] Tap twice: "3 of 3", more cracks.
- [ ] Tap third time: orb shrinks/fades (shatter). After animation, reveal panel appears.
- [ ] Reveal shows: "+XX OT Points", subtext "Daily Ritual", streak bar, Done button, "View Wallet" / "View Badges" links.
- [ ] If a badge was awarded: "New Badge! [Name]" chip appears.
- [ ] Tap Done: section collapses to "Done for today"; streak count updates.

## 2) Once per day / idempotent

- [ ] After claiming, tap again (or reopen app): Daily Ritual shows "Done for today" (no second orb).
- [ ] (If you can change device date or wait until next day): Next day, orb is available again. Claim again; second claim same day still returns "already claimed" payload if server is used.

## 3) Offline / failure

- [ ] With network off (or before Cloud Function is deployed): after shatter, message shows "Connect to claim your daily reward." or similar; no points granted. No crash.

## 4) Feature flags

- [ ] In Admin Hub → Flags, turn off "Daily Orb Ritual". Orb tab: Daily Ritual section hidden or orb uses client-only fallback (no server claim).
- [ ] Turn off "Ritual: points": claim succeeds but points display 0 or server returns 0.
- [ ] Turn off "Ritual: badges": no badge roll / no "New Badge!" chip.

## 5) Admin config

- [ ] Admin Hub → System → Daily Orb Ritual. Change Points min/max, daily max, Badge common % / rare %. Save. (Server may need deploy to read new config; client defaults apply until then.)
- [ ] "Last updated" and "Reset to defaults" work.

## 6) Badges on Profile

- [ ] Profile → Badges section. Shows "X earned" (legacy + ritual).
- [ ] Ritual collectibles: list of earned ritual badges (name + tier). Tap one: detail modal with name, description, tier. Done closes.
- [ ] After earning a ritual badge from orb, open Profile: new badge appears in Ritual collectibles.

## 7) View Wallet / View Badges

- [ ] From reveal panel, tap "View Wallet": navigates to Wallet tab.
- [ ] Tap "View Badges": navigates to Profile tab (badges section).

## 8) No regressions

- [ ] No new crashes on Orb, Profile, Admin.
- [ ] No new TypeScript errors. Existing flows (streak, wallet, other rewards) unchanged.
