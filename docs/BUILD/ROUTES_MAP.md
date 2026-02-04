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
| `/missions` | `app/missions.tsx` | OrbQuest™ daily missions |
| `/stats` | `app/stats.tsx` | Your Stats / Partner Insights — points, streak, missions, badges |
| `/premium` | `app/premium.tsx` | OrbTap Premium — benefits, badge, upgrade CTA |

## Entry points

- App root: `/(tabs)` (map tab).
- OrbPulse Live: Home "See all" (when isOrbPulseEnabled) → `/pulse`; or direct `/pulse`.
- Stats: Menu → Stats → `/stats`; or Profile → "View full stats" → `/stats`.
- Premium: Menu → Premium → `/premium`; or Stats → "Explore Premium" → `/premium`.
- Auth: `/auth` → `/auth/login`.
- Legal: `/legal` → directory; then `/legal/privacy`, `/legal/terms`, `/legal/guidelines`, `/legal/acceptable-use`.
- Data deletion: `/data/delete` (form + submit).
