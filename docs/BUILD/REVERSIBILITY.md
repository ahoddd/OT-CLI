# Reversibility Guide — Recent Build Changes

This doc describes how to **reverse** (disable or remove) recent features if you do not want them. All changes are additive and flag/context-based where possible.

---

## 1. Admin Hub — Display Names (Page/Feature Renaming)

**What it is:** Admin Hub → **Names** section lets you change labels for directory items, tabs, quick actions, and screen titles (e.g. Leaderboard header/hero/tagline). Stored in `AdminLayoutContext` and persisted to AsyncStorage key `ORBTAP_ADMIN_LAYOUT_V1` under `displayNames`.

**How to reverse:**
- **Revert names to defaults:** In Admin Hub → Names, clear each text field (leave blank) so the app falls back to defaults from `constants/AdminConfig.ts`.
- **Remove the feature:** Delete the "Names" section block in `app/admin/index.tsx` (the `section === 'names'` block). Remove `'names'` from the Hub directory pills and from the `Section` type. Remove `getDisplayName` / `setDisplayName` usage from `MasterDirectory`, `app/leaderboard.tsx`, `app/(tabs)/orb.tsx`, and Admin Layout rows; use static `TAB_LABELS`, `DIRECTORY_LABELS_DEFAULT`, `QUICK_ACTION_CONFIG`, and hardcoded strings again. Optionally remove `displayNames` from `AdminLayoutState` and load/save in `constants/AdminConfig.ts` and `context/AdminLayoutContext.tsx`.

---

## 2. Admin Hub — Hub Directory + Color Coding

**What it is:** A single “Hub directory” strip at the top of Admin Hub (horizontal pills: Flags, Layout, Names, Broadcast, System) with color dots. The older **segmented** control (duplicate section switcher) was removed.

**How to reverse:**
- **Restore segmented control:** In `app/admin/index.tsx`, add back the `<View style={[styles.segmented, ...]>` block that renders the five segment buttons below the header (copy from git history before “remove duplicate filters”).
- **Remove Hub directory:** Delete the “Hub directory” `<View style={[styles.hubDirectory, ...]>` block. Section colors are defined in `SECTION_COLORS`; you can remove that constant if you restore a single segment bar without color coding.

---

## 3. Local Legends (Leaderboard) — Layout and UX

**What it is:** Logo and trophy side-by-side (no overlap), “Live” pill, “Your rank” card, “RANKINGS” list header, share CTA copy, and scroll fix (list `paddingBottom` = 120 + safe area so the fixed share bar doesn’t hide content).

**How to reverse:**
- **Revert hero layout:** In `app/leaderboard.tsx`, restore the previous hero: single `heroLogoWrap` with logo and absolutely positioned `trophyBadge` (see git history).
- **Remove Live / Your rank / RANKINGS header:** Delete the `heroProofRow` (Live pill), `yourRankCard`, and `listHeader` blocks and their styles.
- **Revert share copy:** Change share prompt and button text back to “Proud of your rank?” and “Share your streak”.
- **Scroll behavior:** The scroll fix is `contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}` with `listBottomPadding = 120 + insets.bottom`. To revert, use `contentContainerStyle={styles.list}` and restore `paddingBottom: 120` in `styles.list`.

---

## 4. OrbOpportunities (Partner Hiring + Verified Work Receipts)

**What it is:** New module for partner opportunity posts, user applications, slot reservation, verified work receipts, and partner records/export. Gated by feature flag `isOrbOpportunitiesEnabled` (see `constants/Flags.ts` and directory/route conditionals).

**How to reverse:**
- **Disable without removing code:** Set `isOrbOpportunitiesEnabled` to `false` in `constants/Flags.ts` (default). This hides the directory tile and any entry points; routes can remain but won’t be linked.
- **Full removal:** See `docs/BUILD/ORB_OPPORTUNITIES_REVERSIBILITY.md` (created with the module) for a checklist of files and references to remove.

---

## General

- **Display names** and **Hub directory** are the only changes that touch `AdminLayoutContext` and `AdminConfig`; reversing them restores previous behavior without breaking the app.
- **Leaderboard** and **OrbOpportunities** are self-contained in their screens and constants; reversing steps above do not require new global state or navigation.
