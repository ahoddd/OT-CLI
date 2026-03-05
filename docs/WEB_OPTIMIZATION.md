# OrbTap Web — Optimization & Behavior

The app runs on web via Expo (Metro bundler, static export). This doc summarizes what is optimized for web and what falls back or is disabled.

## Build & deploy

- **Dev:** `npm run web` → `expo start --web`
- **Export:** `npm run export:web` → `expo export --platform web` (writes to `dist/`)
- **Hostinger:** `npm run build:web` → export + copies `hostinger.htaccess` to `dist/.htaccess`

Config: `app.config.js` sets `web.output: "static"`, `web.meta` (viewport, theme-color), `web.display: "standalone"`, and `web.startUrl: "/"` for PWA-style behavior. Export produces static HTML and per-route files for SPA routing.

## Web-specific behavior

| Area | Behavior on web |
|------|------------------|
| **Document title** | Root layout sets default; per-route titles via `useWebTitle()` (e.g. Sign in, Create account, Get started, Settings, Home). |
| **Map (home tab)** | Mapbox is disabled; placeholder with "Get the app" CTA. Grid view works. |
| **Scan tab** | Placeholder: "Use the OrbTap mobile app to scan partner QR codes." |
| **Push notifications** | Registration and notification response listener are no-ops on web. |
| **Alerts / confirm** | `utils/alert.ts` uses `window.alert` and `window.confirm` on web. |
| **Haptics** | `utils/safeHaptics.ts` no-ops on web (and simulator). |
| **KeyboardAvoidingView** | Login uses `undefined` behavior on web to avoid layout issues; signup already uses `undefined` for non-iOS. |

## What works on web

- Auth (login, signup, onboarding), landing, features, legal pages.
- Tabs: Orb, Pulse, People, Wallet, Profile, Settings, etc.
- Grid view on home (partners/perks), Pulse, leaderboard, missions, premium, admin (for admins).
- Deep links and refresh when served with `.htaccess` or Firebase Hosting rewrites.

## Optional: per-route titles

To set page-specific titles on web, you can use `useEffect` + `document.title` in a screen or add a small helper that reads the current route and sets the title. The root layout sets the default app title.
