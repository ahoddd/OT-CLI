# OrbTap — Route Map (MVP)

Source: `app/` file-based routing (Expo Router).  
Last updated: Gap-fix implementation.

## Tabs (bottom nav)

| Route | File | Notes |
|-------|------|------|
| `/(tabs)/map` | `app/(tabs)/index.tsx` | Default tab; map + orb pins |
| `/(tabs)/scan` | `app/(tabs)/scan.tsx` | QR scanner |
| `/(tabs)/orb` | `app/(tabs)/orb.tsx` | Orb hub; streak + quick actions |
| `/(tabs)/wallet` | `app/(tabs)/wallet.tsx` | Balance + ledger |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Account + settings entry |

## Non-tab routes

| Route | File | Notes |
|-------|------|------|
| `/` | `app/index.tsx` | Redirects to `/(tabs)` |
| `/auth` | `app/auth/index.tsx` | Redirects to `/auth/login` |
| `/auth/login` | `app/auth/login.tsx` | Login |
| `/auth/signup` | `app/auth/signup.tsx` | Sign up |
| `/auth/onboarding` | `app/auth/onboarding.tsx` | Onboarding |
| `/partner/[id]` | `app/partner/[id].tsx` | Partner profile |
| `/partner/dashboard` | `app/partner/dashboard.tsx` | Partner dashboard |
| `/perk/[id]` | `app/perk/[id].tsx` | Perk detail |
| `/proof/[id]` | `app/proof/[id].tsx` | Proof card + share |
| `/spheres` | `app/spheres/index.tsx` | Circles hub |
| `/spheres/[id]` | `app/spheres/[id].tsx` | Circle detail |
| `/invite/[code]` | `app/invite/[code].tsx` | Invite code join |
| `/orbsignal` | `app/orbsignal/index.tsx` | OrbSignal list / prediction market |
| `/orbsignal/[id]` | `app/orbsignal/[id].tsx` | OrbSignal market detail |
| `/admin` | `app/admin/index.tsx` | Admin Hub; flags + audit |
| `/settings` | `app/settings.tsx` | Settings; stats, legal links |
| `/legal` | `app/legal/index.tsx` | Legal directory |
| `/legal/privacy` | `app/legal/privacy.tsx` | Privacy Policy |
| `/legal/terms` | `app/legal/terms.tsx` | Terms of Service |
| `/legal/guidelines` | `app/legal/guidelines.tsx` | Community Guidelines |
| `/legal/acceptable-use` | `app/legal/acceptable-use.tsx` | Acceptable Use Policy |
| `/legal/[id]` | `app/legal/[id].tsx` | Generic legal by id |
| `/support` | `app/support/index.tsx` | Support |
| `/report` | `app/report.tsx` | Report flow |
| `/data/delete` | `app/data/delete.tsx` | Data deletion request |
| `/leaderboard` | `app/leaderboard.tsx` | Leaderboard |
| `/vote` | `app/vote/index.tsx` | Vote / OrbVote |
| `/upgrades` | `app/upgrades.tsx` | Upgrades (tap power) |
| `/inventory` | `app/inventory.tsx` | Inventory (orb skins) |
| `/pulse` | `app/pulse.tsx` | OrbPulse™ Live — ranked feed (proof-based) |
| `/feed` | `app/feed.tsx` | OrbPulse Commerce Feed (OrbFeed) — partner posts, CTAs |
| `/feed/[id]` | `app/feed/[id].tsx` | OrbFeed post detail — full content, CTA, share |
| `/drop/[id]` | `app/drop/[id].tsx` | OrbDrop™ detail — reserve / redeem → proof |
| `/orbswipe` | `app/orbswipe.tsx` | OrbSwipe™ — swipe deck, tray, Fuse My Night (v1.1: Tune, Recap, low-supply fallback) |
| `/partner/orbswipe` | `app/partner/orbswipe.tsx` | Partner OrbSwipe Cockpit — leads, drops, reviews; Pro: Swipe Studio |
| `/missions` | `app/missions.tsx` | Missions — daily missions, visit partners, earn OT |
| `/stats` | `app/stats.tsx` | Your Stats / Partner Insights — points, streak, missions, badges |
| `/premium` | `app/premium.tsx` | OrbTap Premium — benefits, badge, upgrade CTA |
| `/work-orders` | `app/work-orders/index.tsx` | OrbWork Orders™ list (customer requests / partner inbox) |
| `/work-orders/create` | `app/work-orders/create.tsx` | Request Work — create work order (e.g. from partner page) |
| `/work-orders/[id]` | `app/work-orders/[id].tsx` | Work order detail + timeline; customer Approve/Dispute; partner Accept/Schedule/Milestones/Submit completion |
| `/opportunities` | `app/opportunities/index.tsx` | OrbOpportunities™ — browse published opportunities (user) |
| `/opportunities/[id]` | `app/opportunities/[id].tsx` | Opportunity detail + Apply |
| `/opportunities/my-applications` | `app/opportunities/my-applications.tsx` | User's applications + verified work receipts |
| `/partner/opportunities` | `app/partner/opportunities/index.tsx` | Partner list opportunities |
| `/partner/opportunities/create` | `app/partner/opportunities/create.tsx` | Partner create opportunity |
| `/partner/opportunities/[id]` | `app/partner/opportunities/[id].tsx` | Partner opportunity detail — applicants, accept/reject, verify completion |
| `/partner/opportunities/records` | `app/partner/opportunities/records.tsx` | Partner records & export (CSV/JSON) for bookkeeping |
| `/stamp-cards` | `app/stamp-cards/index.tsx` | Stamp Cards — Reward Locker + all cards + Scan to stamp (from Wallet, OrbSheet) |
| `/partner/stamp-studio` | `app/partner/stamp-studio.tsx` | Stamp Cards — create/manage stamp programs |
| `/partner/stamp-redeem` | `app/partner/stamp-redeem.tsx` | Stamp Cards — partner redeem customer reward (enter code) |
| `/meal-mode` | `app/meal-mode.tsx` | Meal Mode — full-screen OrbSwipe meal discovery, tray, Fuse My Meal |
| `/partner/meal-proposals` | `app/partner/meal-proposals.tsx` | Partner Meal Studio — create/manage meal proposals |

## Entry points

- App root: `/(tabs)` (map tab).
- OrbPulse Live: Home "See all" (when isOrbPulseEnabled) → `/pulse`; or direct `/pulse`.
- OrbSwipe: Orb hub Discover tile "[Name] Tonight" (when isOrbSwipeEnabled) → `/orbswipe`; Directory / Search / All pages → `/orbswipe`. Partner Dashboard "OrbSwipe Cockpit" → `/partner/orbswipe`.
- Stats: Menu → Stats → `/stats`; or Profile → "View full stats" → `/stats`.
- Premium: Menu → Premium → `/premium`; or Stats → "Explore Premium" → `/premium`.
- Auth: `/auth` → `/auth/login`.
- Legal: `/legal` → directory; then `/legal/privacy`, `/legal/terms`, `/legal/guidelines`, `/legal/acceptable-use`.
- Data deletion: `/data/delete` (form + submit).
- OrbWork Orders: Master Directory → OrbWork Orders → `/work-orders`; or Partner page → Request Work → `/work-orders/create?partnerId=…` → then `/work-orders/[id]`.
- Meal Mode: Sphere page → "OrbSwipe Meals" → `/meal-mode?sphereId=…`. Partner Dashboard → "Meal Studio" → `/partner/meal-proposals`.
- Commerce Feed: Master Directory → Commerce Feed → `/feed`; Post detail → `/feed/[id]`. Partner Dashboard → Create post → `/partner/posts/create` (when OrbFeed + composer enabled).
- OrbOpportunities: Master Directory → Opportunities → `/opportunities` (when isOrbOpportunitiesEnabled). Partner Dashboard → Manage opportunities → `/partner/opportunities` (create, list, records/export). User: browse → `/opportunities/[id]` → Apply; My applications → `/opportunities/my-applications`.
