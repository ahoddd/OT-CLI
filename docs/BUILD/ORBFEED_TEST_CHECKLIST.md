# OrbPulse Commerce Feed (OrbFeed) — Manual Test Checklist

Use this to validate the Commerce Feed and partner composer.

## 1. Feed screen and filters

- [ ] **Entry**: Master Directory → Commerce Feed (when isOrbFeedEnabled). Opens `/feed`.
- [ ] **Off state**: Admin → set isOrbFeedEnabled OFF → Commerce Feed tile hidden in directory (or open `/feed` directly shows "Feed is off").
- [ ] **Tabs**: Nearby, Tonight, Drops, New, Services, Following, Deals — each filters posts; no crash.
- [ ] **Cards**: Partner name + verified badge, post type badge, title, body preview, primary CTA label, "X verified today" when applicable, scarcity/timer, "Sponsored" when boosted.
- [ ] **Pull to refresh**: Refreshes without error.

## 2. Post detail

- [ ] Tap a post → `/feed/[id]` opens with full title, body, CTA button.
- [ ] "Why you're seeing this" and proof-backed note when applicable.
- [ ] CTA "Navigate" → opens partner page when targetRef is partner.
- [ ] CTA for Drop → opens `/drop/[id]` when targetRef is drop id.
- [ ] Share button opens share sheet.

## 3. Partner composer

- [ ] **Entry**: Partner Dashboard → Create post (when isOrbFeedPartnerComposerEnabled). Opens `/partner/posts/create`.
- [ ] **Off state**: isOrbFeedPartnerComposerEnabled OFF → Create post row hidden on dashboard (or screen shows "Composer is off").
- [ ] **Post type**: Select DROP, EVENT, PRODUCT, ANNOUNCEMENT, etc. — selection updates.
- [ ] **Title**: 6–60 chars; character count; Publish disabled until valid.
- [ ] **Body**: 20–400 chars; character count; Publish disabled until valid.
- [ ] **CTA**: Select CLAIM, RESERVE, BUY, NAVIGATE, SAVE, PLAN.
- [ ] **Publish**: Valid title + body → Publish → success alert → back to dashboard.

## 4. Feature flags (default ON)

- [ ] Fresh install or Admin → Reset flags: isOrbFeedEnabled, isOrbFeedPartnerComposerEnabled, isOrbFeedClaimsEnabled, isOrbFeedBoostsEnabled, isOrbFeedPartnerAnalyticsEnabled, isOrbFeedModerationEnabled are ON; isOrbFeedPurchasesEnabled is OFF.
- [ ] Toggling isOrbFeedEnabled OFF hides Commerce Feed from directory and shows off state on `/feed`.

## 5. No dead ends

- [ ] All feed and composer routes load; no blank screen.
- [ ] Back from feed, post detail, and composer returns to previous screen.
- [ ] No new TypeScript errors; app builds and runs.

## 6. Backend (when wired)

- [ ] GET /v1/posts/feed?mode=&cursor= returns posts for mode.
- [ ] GET /v1/posts/:id returns single post.
- [ ] POST /v1/posts/:id/action (IMPRESSION/OPEN/SAVE/SHARE/CTA_CLICK) rate-limited.
- [ ] POST /v1/posts/:id/claim idempotent; creates receipt when configured.
- [ ] Partner POST create/publish; admin moderate with audit log.
