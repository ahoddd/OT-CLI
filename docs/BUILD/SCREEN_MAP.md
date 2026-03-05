# OrbTap — Complete Screen Map (Phase 0)

Generated: 2026-03-04 | 178 screen files audited.

Legend: U = User | P = Partner | A = Admin | ★ = North Star critical path

---

## 1. Tab Navigation (Bottom Nav — always visible)

| Route | File | Role | Purpose | Entry Points | NS Critical |
|-------|------|------|---------|--------------|------------|
| `/(tabs)` / `/(tabs)/index` | `app/(tabs)/index.tsx` | U | Discovery Hub — Map / Grid / Swipe tri-modal | App root, deep links | ★ |
| `/(tabs)/scan` | `app/(tabs)/scan.tsx` | U | QR scanner + verify | Tab bar, Orb hub, Perk detail, OrbPilot | ★ |
| `/(tabs)/orb` | `app/(tabs)/orb.tsx` | U | Orb Hub — streak, quick actions, missions, tiles | Tab bar center (NavOrb) | ★ |
| `/(tabs)/wallet` | `app/(tabs)/wallet.tsx` | U | OT Points balance, ledger, stamp cards, power-ups | Tab bar, Proof card | ★ |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | U | Account, badges, social, settings entry | Tab bar | |

### Conditional tab slots (Admin-configurable)

| Tab Key | File | Role | Purpose |
|---------|------|------|---------|
| `/(tabs)/orbsignal` | `app/(tabs)/orbsignal.tsx` | U | OrbSignal tab shortcut |
| `/(tabs)/pulse` | `app/(tabs)/pulse.tsx` | U | OrbPulse live feed tab shortcut |
| `/(tabs)/missions` | `app/(tabs)/missions.tsx` | U | Missions tab shortcut |
| `/(tabs)/leaderboard` | `app/(tabs)/leaderboard.tsx` | U | Leaderboard tab shortcut |
| `/(tabs)/premium` | `app/(tabs)/premium.tsx` | U | Premium upsell tab shortcut |
| `/(tabs)/settings` | `app/(tabs)/settings.tsx` | U | Settings tab shortcut |
| `/(tabs)/bookmarks` | `app/(tabs)/bookmarks.tsx` | U | Bookmarks tab shortcut |
| `/(tabs)/knowledge` | `app/(tabs)/knowledge.tsx` | U | Knowledge base tab shortcut |
| `/(tabs)/stats` | `app/(tabs)/stats.tsx` | U/P | Stats tab shortcut |
| `/(tabs)/spheres` | `app/(tabs)/spheres.tsx` | U | Spheres tab shortcut |
| `/(tabs)/upgrades` | `app/(tabs)/upgrades.tsx` | U | Upgrades tab shortcut |
| `/(tabs)/compare-accounts` | `app/(tabs)/compare-accounts.tsx` | U | Account comparison |
| `/(tabs)/admin` | `app/(tabs)/admin.tsx` | A | Admin tab shortcut |
| `/(tabs)/intent` | `app/(tabs)/intent.tsx` | U | OrbIntent tab |
| `/(tabs)/orbpass` | `app/(tabs)/orbpass.tsx` | U | OrbPass tab |
| `/(tabs)/bounty` | `app/(tabs)/bounty.tsx` | U | OrbBounty tab |
| `/(tabs)/work-orders` | `app/(tabs)/work-orders.tsx` | U/P | Work orders tab |

### Partner tab slots

| Tab Key | File | Role | Purpose |
|---------|------|------|---------|
| `/(tabs)/partner-orb` | `app/(tabs)/partner-orb.tsx` | P | Partner command center tab |
| `/(tabs)/partner-dashboard` | `app/(tabs)/partner-dashboard.tsx` | P | Partner dashboard tab |
| `/(tabs)/partner-perks` | `app/(tabs)/partner-perks.tsx` | P | Partner perks management |
| `/(tabs)/partner-polls` | `app/(tabs)/partner-polls.tsx` | P | Partner polls |
| `/(tabs)/partner-feed` | `app/(tabs)/partner-feed.tsx` | P | Partner feed/posts |
| `/(tabs)/partner-settings` | `app/(tabs)/partner-settings.tsx` | P | Partner settings |

---

## 2. Authentication Flow

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/auth` | `app/auth/index.tsx` | U/P | Redirects to login | Unauthenticated guard |
| `/auth/login` | `app/auth/login.tsx` | U/P | Email + biometric login | Auth redirect, signup link |
| `/auth/signup` | `app/auth/signup.tsx` | U/P | New account registration | Login "sign up" link |
| `/auth/onboarding` | `app/auth/onboarding.tsx` | U/P | Post-signup onboarding slides, invite | Post-signup |

---

## 3. Discovery & Map

| Route | File | Role | Purpose | Entry Points | NS Critical |
|-------|------|------|---------|--------------|------------|
| `/partner/[id]` | `app/partner/[id].tsx` | U | Public partner profile, perks, follow | OrbSheet, search, grid, directory | ★ |
| `/perk/[id]` | `app/perk/[id].tsx` | U | Perk detail + redeem CTA | Partner page, OrbSheet, search | ★ |
| `/partners` | `app/partners.tsx` | U | All partners directory | Directory, search |
| `/tonight` | `app/tonight.tsx` | U | "Tonight" discovery — open now partners | Orb hub, OrbSwipe |
| `/orbswipe` | `app/orbswipe.tsx` | U | OrbSwipe™ — Tinder-style plan builder | Discovery Hub (swipe view), orb hub |
| `/orbswipe-saved` | `app/orbswipe-saved.tsx` | U | Saved OrbSwipe plan | OrbSwipe tray |
| `/meal-mode` | `app/meal-mode.tsx` | U | Meal Mode — full-screen swipe for food | Sphere page, orb hub |

---

## 4. Verified Action & Proof (North Star Core)

| Route | File | Role | Purpose | Entry Points | NS Critical |
|-------|------|------|---------|--------------|------------|
| `/(tabs)/scan` | `app/(tabs)/scan.tsx` | U | QR scanner — starts verification | Tab bar, perk page, OrbPilot | ★ |
| `/scan/success` | `app/scan/success.tsx` | U | Verified win celebration — points earned | Post-scan | ★ |
| `/proof/[id]` | `app/proof/[id].tsx` | U | Proof Card — shareable artifact | Scan success, wallet ledger | ★ |
| `/drop/[id]` | `app/drop/[id].tsx` | U | OrbDrop detail — reserve / redeem | Map drops, OrbFeed |
| `/stamp-cards` | `app/stamp-cards/index.tsx` | U | Stamp card wallet — reward locker | Wallet tab, scan stamp QR |
| `/stamp/success` | `app/stamp/success.tsx` | U | Stamp earned confirmation | Post-stamp scan |

---

## 5. Wallet & Orbinomics

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/(tabs)/wallet` | `app/(tabs)/wallet.tsx` | U | OT Points balance, ledger, stamp cards, power-ups | Tab bar | ★ |
| `/inventory` | `app/inventory.tsx` | U | Badges / Power-ups / Receipts inventory | Wallet, profile |
| `/upgrades` | `app/upgrades.tsx` | U | Tap power upgrades | Orb hub, profile |
| `/premium` | `app/premium.tsx` | U | Premium subscription benefits + upgrade | Profile, orb hub, stats |
| `/pro` | `app/pro.tsx` | U | Pro plan detail | Premium page |
| `/features` | `app/features.tsx` | U | Full features list | Onboarding, settings |

---

## 6. Social & Community

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/people` | `app/people.tsx` | U | Friends + connection requests | Profile tab, search |
| `/user/[id]` | `app/user/[id].tsx` | U | Public user profile | Leaderboard, pulse, people |
| `/spheres` | `app/spheres/index.tsx` | U | Spheres/Circles hub | Profile, tab |
| `/spheres/[id]` | `app/spheres/[id].tsx` | U | Sphere detail — members, shared progress | Spheres hub |
| `/spheres/join` | `app/spheres/join.tsx` | U | Join sphere via code | Invite link |
| `/invite/[code]` | `app/invite/[code].tsx` | U | Invite code landing — join sphere | Deep link |
| `/invite` | `app/invite/index.tsx` | U | Invite hub — share invite link | Profile, onboarding |
| `/leaderboard` | `app/leaderboard.tsx` | U | Global + city leaderboard | Profile, orb hub, tab |
| `/pulse` | `app/pulse.tsx` | U | OrbPulse™ live proof feed | Discovery hub, orb hub |
| `/compare-accounts` | `app/compare-accounts.tsx` | U | Side-by-side account compare | Leaderboard, profile |

---

## 7. Engagement & Gamification

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/missions` | `app/missions.tsx` | U | Daily missions — earn OT Points | Orb hub, tab, scan success |
| `/achievements` | `app/achievements.tsx` | U | Badge showcase + progress | Profile, orb hub |
| `/stats` | `app/stats.tsx` | U/P | Personal stats + partner insights | Profile, menu |
| `/orbsignal` | `app/orbsignal/index.tsx` | U | OrbSignal™ prediction markets | Orb hub, tab, directory |
| `/orbsignal/[id]` | `app/orbsignal/[id].tsx` | U | Market detail — forecast + result | OrbSignal list |
| `/orbsignal/m1` | `app/orbsignal/m1.tsx` | U | OrbSignal featured market | Direct |
| `/vote` | `app/vote/index.tsx` | U | OrbVote — polls + earn XP | Orb hub, directory |
| `/knowledge` | `app/knowledge.tsx` | U | Knowledge base — learn OrbTap | Orb hub, help |
| `/learn` | `app/learn.tsx` | U | Learn how OrbTap works | Onboarding |
| `/bookmarks` | `app/bookmarks.tsx` | U | Saved partners, perks, drops | Tab, profile |
| `/feed` | `app/feed/index.tsx` | U | Commerce Feed — partner posts + CTAs | Directory, orb hub |
| `/feed/[id]` | `app/feed/[id].tsx` | U | Feed post detail | Feed list |

---

## 8. OrbPilot™ (Verified Visit Autopilot — User)

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/orbpilot` | `app/orbpilot/index.tsx` | U | OrbPilot offer list | Orb hub, directory |
| `/orbpilot/[id]` | `app/orbpilot/[id].tsx` | U | OrbPilot offer detail | List |
| `/orbpilot/scan` | `app/orbpilot/scan.tsx` | U | OrbPilot QR scan | Offer detail |
| `/orbpilot/result` | `app/orbpilot/result.tsx` | U | OrbPilot completion + proof | Post-scan |
| `/orbpilot/claimed` | `app/orbpilot/claimed.tsx` | U | OrbPilot already claimed | Guard |
| `/orbpilot/history` | `app/orbpilot/history.tsx` | U | OrbPilot completion history | Profile |
| `/orbpilot/pin` | `app/orbpilot/pin.tsx` | U | OrbPilot PIN verification | Verify flow |
| `/orbpilot/location-gate` | `app/orbpilot/location-gate.tsx` | U | Location verification gate | Offer |
| `/orbpilot/troubleshoot` | `app/orbpilot/troubleshoot.tsx` | U | Scan troubleshoot | Scan error |

---

## 9. OrbPass™

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/orbpass` | `app/orbpass/index.tsx` | U | OrbPass subscription list | Tab, orb hub |
| `/orbpass/offer/[id]` | `app/orbpass/offer/[id].tsx` | U | OrbPass offer detail | List |
| `/orbpass/redeem/[redemptionId]` | `app/orbpass/redeem/[redemptionId].tsx` | U | Redeem OrbPass | Offer |
| `/orbpass/history` | `app/orbpass/history.tsx` | U | OrbPass redemption history | Profile |
| `/orbpass/partner-inbox` | `app/orbpass/partner-inbox.tsx` | P | Partner incoming OrbPass requests | Partner dashboard |
| `/orbpass/partner-verify` | `app/orbpass/partner-verify.tsx` | P | Partner verification of OrbPass | Inbox |

---

## 10. OrbIntent™ / OrbBounty™

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/intent` | `app/intent/index.tsx` | U | OrbIntent list — "I want X" | Tab, orb hub |
| `/intent/[id]` | `app/intent/[id].tsx` | U | Intent detail | List |
| `/intent/create` | `app/intent/create.tsx` | U | Create intent | List CTA |
| `/intent/deal/[cardId]` | `app/intent/deal/[cardId].tsx` | U | Intent deal card | Intent detail |
| `/intent/locked/[id]` | `app/intent/locked/[id].tsx` | U | Locked intent gate | Intent |
| `/intent/offer/create` | `app/intent/offer/create.tsx` | P | Partner create offer | Dashboard |
| `/intent/rules/create` | `app/intent/rules/create.tsx` | P | Partner create rules | Dashboard |
| `/intent/verify` | `app/intent/verify.tsx` | U/P | Verify intent completion | Intent |
| `/bounty` | `app/bounty/index.tsx` | U | OrbBounty list | Tab, directory |
| `/bounty/[id]` | `app/bounty/[id].tsx` | U | Bounty detail | List |
| `/bounty/create` | `app/bounty/create.tsx` | U | Create bounty | List CTA |
| `/bounty/bid/create` | `app/bounty/bid/create.tsx` | P | Partner bid on bounty | Bounty detail |
| `/bounty/locked/[id]` | `app/bounty/locked/[id].tsx` | U | Locked bounty gate | Bounty |
| `/bounty/verify/[id]` | `app/bounty/verify/[id].tsx` | U/P | Verify bounty completion | Bounty |
| `/bounty/win/[id]` | `app/bounty/win/[id].tsx` | U | Bounty win celebration | Post-verify |
| `/deal/[cardId]` | `app/deal/[cardId].tsx` | U | Deal card detail | Intent/bounty |

---

## 11. OrbWork Orders™ (Service Marketplace)

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/work-orders` | `app/work-orders/index.tsx` | U/P | Work order list | Directory, tab |
| `/work-orders/create` | `app/work-orders/create.tsx` | U | Create work order | Partner page CTA |
| `/work-orders/[id]` | `app/work-orders/[id].tsx` | U/P | Work order detail + timeline | List |

---

## 12. OrbOpportunities™ (Gig Marketplace)

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/opportunities` | `app/opportunities/index.tsx` | U | Browse opportunities | Directory, tab |
| `/opportunities/[id]` | `app/opportunities/[id].tsx` | U | Opportunity detail + apply | List |
| `/opportunities/my-applications` | `app/opportunities/my-applications.tsx` | U | My applications + verified receipts | Profile |
| `/partner/opportunities` | `app/partner/opportunities/index.tsx` | P | Partner list opportunities | Dashboard |
| `/partner/opportunities/create` | `app/partner/opportunities/create.tsx` | P | Create opportunity | Partner opps |
| `/partner/opportunities/[id]` | `app/partner/opportunities/[id].tsx` | P | Manage applicants | Partner opps |
| `/partner/opportunities/records` | `app/partner/opportunities/records.tsx` | P | Records + export | Dashboard |

---

## 13. Partner-Facing Screens

| Route | File | Role | Purpose | Entry Points |
|-------|------|------|---------|--------------|
| `/partner-apply` | `app/partner-apply.tsx` | U→P | Apply to become partner | Profile, settings |
| `/partner/dashboard` | `app/partner/dashboard.tsx` | P | Partner command center | Partner tab |
| `/partner/onboarding` | `app/partner/onboarding/index.tsx` | P | Partner onboarding wizard | Post-apply |
| `/partner/edit-page` | `app/partner/edit-page.tsx` | P | Edit partner profile | Dashboard |
| `/partner/perk-form` | `app/partner/perk-form.tsx` | P | Create/edit perk | Dashboard, perks |
| `/partner/perks` | `app/partner/perks/index.tsx` | P | Manage perks list | Dashboard |
| `/partner/hotspot-activate` | `app/partner/hotspot-activate.tsx` | P | Activate hotspot | Dashboard |
| `/partner/referral` | `app/partner/referral.tsx` | P | Partner referral | Dashboard |
| `/partner/orbswipe` | `app/partner/orbswipe.tsx` | P | OrbSwipe cockpit — leads, reviews | Dashboard |
| `/partner/stamp-studio` | `app/partner/stamp-studio.tsx` | P | Create/manage stamp programs | Dashboard |
| `/partner/stamp-redeem` | `app/partner/stamp-redeem.tsx` | P | Redeem customer stamp reward | Dashboard |
| `/partner/meal-proposals` | `app/partner/meal-proposals.tsx` | P | Meal proposal studio | Dashboard |
| `/partner/menu` | `app/partner/menu/index.tsx` | P | Menu management | Dashboard |
| `/partner/menu/edit` | `app/partner/menu/edit.tsx` | P | Edit menu item | Menu |
| `/partner/menu/upload` | `app/partner/menu/upload.tsx` | P | Upload menu (OCR) | Menu |
| `/partner/polls` | `app/partner/polls/index.tsx` | P | Partner polls list | Dashboard |
| `/partner/polls/create` | `app/partner/polls/create.tsx` | P | Create poll | Polls list |
| `/partner/posts` | `app/partner/posts/index.tsx` | P | Partner posts list | Dashboard |
| `/partner/posts/create` | `app/partner/posts/create.tsx` | P | Create commerce post | Posts |
| `/partner/reviews/[id]` | `app/partner/reviews/[id].tsx` | P | Review detail | Dashboard |
| `/partner/signal/create` | `app/partner/signal/create.tsx` | P | Create OrbSignal market | Dashboard |
| `/partner/sponsor-mission` | `app/partner/sponsor-mission.tsx` | P | Sponsor a mission | Dashboard |
| `/partner/invite-sphere` | `app/partner/invite-sphere.tsx` | P | Invite sphere to partner | Dashboard |

### Partner OrbPilot™ Admin

| Route | File | Role | Purpose |
|-------|------|------|---------|
| `/partner/orbpilot/cockpit` | `app/partner/orbpilot/cockpit.tsx` | P | OrbPilot campaign cockpit |
| `/partner/orbpilot/setup` | `app/partner/orbpilot/setup.tsx` | P | Campaign setup wizard |
| `/partner/orbpilot/schedule` | `app/partner/orbpilot/schedule.tsx` | P | Schedule campaign |
| `/partner/orbpilot/analytics` | `app/partner/orbpilot/analytics.tsx` | P | Campaign analytics |
| `/partner/orbpilot/activity` | `app/partner/orbpilot/activity.tsx` | P | Visit activity log |
| `/partner/orbpilot/rewards` | `app/partner/orbpilot/rewards.tsx` | P | Reward configuration |
| `/partner/orbpilot/guardrails` | `app/partner/orbpilot/guardrails.tsx` | P | Anti-fraud guardrails |
| `/partner/orbpilot/disputes` | `app/partner/orbpilot/disputes.tsx` | P | Dispute queue |
| `/partner/orbpilot/verify` | `app/partner/orbpilot/verify.tsx` | P | Verify visit |
| `/partner/orbpilot/verification-help` | `app/partner/orbpilot/verification-help.tsx` | P | Verification help |

---

## 14. Admin Hub

| Route | File | Role | Purpose |
|-------|------|------|---------|
| `/admin` | `app/admin/index.tsx` | A | Admin hub — flags, audit, system info |
| `/admin/partner-form` | `app/admin/partner-form.tsx` | A | Admin partner creation |
| `/admin/perk-form` | `app/admin/perk-form.tsx` | A | Admin perk creation |
| `/admin/perks` | `app/admin/perks.tsx` | A | Admin perks list |
| `/admin/polls` | `app/admin/polls/index.tsx` | A | Admin polls list |
| `/admin/polls/create` | `app/admin/polls/create.tsx` | A | Admin create poll |
| `/admin/orbpilot/control` | `app/admin/orbpilot/control.tsx` | A | OrbPilot global control |
| `/admin/orbpilot/trust` | `app/admin/orbpilot/trust.tsx` | A | Trust score management |
| `/admin/orbpilot/risk` | `app/admin/orbpilot/risk.tsx` | A | Risk monitoring |
| `/admin/orbpilot/audit` | `app/admin/orbpilot/audit.tsx` | A | Audit log |
| `/admin/orbpilot/health` | `app/admin/orbpilot/health.tsx` | A | System health |
| `/admin/orbpilot/rules` | `app/admin/orbpilot/rules.tsx` | A | Guardrail rules |
| `/admin/orbpilot/abuse` | `app/admin/orbpilot/abuse.tsx` | A | Abuse detection |
| `/admin/orbpilot/disputes-queue` | `app/admin/orbpilot/disputes-queue.tsx` | A | Disputes queue |

---

## 15. Settings, Legal & Support

| Route | File | Role | Purpose |
|-------|------|------|---------|
| `/settings` | `app/settings.tsx` | U | Settings hub — theme, security, legal links |
| `/full-settings` | `app/full-settings.tsx` | U | Extended settings |
| `/notification-settings` | `app/notification-settings.tsx` | U | Push notification preferences |
| `/notifications` | `app/notifications/index.tsx` | U | Notification center |
| `/legal` | `app/legal/index.tsx` | U | Legal directory |
| `/legal/privacy` | `app/legal/privacy.tsx` | U | Privacy Policy |
| `/legal/terms` | `app/legal/terms.tsx` | U | Terms of Service |
| `/legal/guidelines` | `app/legal/guidelines.tsx` | U | Community Guidelines |
| `/legal/acceptable-use` | `app/legal/acceptable-use.tsx` | U | Acceptable Use Policy |
| `/legal/help` | `app/legal/help.tsx` | U | Help center |
| `/legal/[id]` | `app/legal/[id].tsx` | U | Generic legal doc by id |
| `/support` | `app/support/index.tsx` | U | Support contact |
| `/report` | `app/report.tsx` | U | Report partner/user/perk |
| `/data/delete` | `app/data/delete.tsx` | U | Data deletion request |
| `/tutorials` | `app/tutorials/index.tsx` | U | Tutorials hub |

---

## 16. Utility / Shell

| Route | File | Role | Purpose |
|-------|------|------|---------|
| `/` | `app/index.tsx` | — | Root redirect to `/(tabs)` |
| `+not-found` | `app/+not-found.tsx` | — | 404 not-found handler |

---

## Summary Stats

| Category | Count |
|----------|-------|
| Total screen files | 178 |
| Tab screens | 24 |
| Auth screens | 4 |
| User-facing non-tab | 70+ |
| Partner-facing | 40+ |
| Admin | 14 |
| Legal/Support | 10 |
| North Star critical path | 8 |

---

## Entry Point Hierarchy

```
App Root (/(tabs))
├── Discovery Hub (Map/Grid/Swipe)
│   ├── OrbSheet → Partner/[id] → Perk/[id] → Scan → Success → Proof/[id]
│   └── Grid → Partner/[id]
├── Scan Tab → Success → Proof → Wallet
├── Orb Hub → Missions / Drops / OrbSignal / OrbSwipe / Tonight
├── Wallet → Ledger → Proof/[id] / Stamp Cards / Power-ups
└── Profile → Achievements / People / Spheres / Stats / Settings
```
