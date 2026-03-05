# Mapbox Token Setup — So the Map Shows (Not the Fallback)

OrbTap uses **Mapbox** for the interactive map. If the token isn’t set, you only see the fallback (list) view.

---

## 1. Get a Mapbox token

1. Go to [Mapbox](https://account.mapbox.com/) and sign in (or create an account).
2. Open **Access tokens**.
3. Use the **Default public token** (starts with `pk.`) or create a new **public** token with:
   - **Public** scope (needed for map tiles and geocoding).
   - Optional: set a URL allowlist for extra security (e.g. `https://orbtap.com/*`, your app scheme).

You need **one public token** for:
- Showing the map in the app (`OrbTapMap.tsx`).
- Geocoding in admin/partner forms (`mapboxGeocode.ts`).

---

## 2. Local development

Create a `.env` in the project root (or copy from `.env.example`):

```bash
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_actual_public_token_here
```

Optional (only if you use Mapbox’s native SDK download token for Android/iOS):

```bash
MAPBOX_DOWNLOAD_TOKEN=your_download_token_if_required
```

Restart the dev server so the env is picked up:

```bash
npx expo start --clear
```

---

## 3. EAS Build (App Store / Play Store builds)

The token must be available **during the build** so it gets inlined into the app. Use EAS Secrets:

```bash
# Install EAS CLI if needed
npm install -g eas-cli

# Log in
eas login

# Add the Mapbox public token (replace with your real pk.xxx token)
eas secret:create --name EXPO_PUBLIC_MAPBOX_TOKEN --value "pk.your_actual_public_token_here" --scope project
```

After this, the **next** `eas build` will see `EXPO_PUBLIC_MAPBOX_TOKEN` and the map will work in the built app instead of the fallback.

Optional (only if your native Mapbox setup needs a download token):

```bash
eas secret:create --name MAPBOX_DOWNLOAD_TOKEN --value "your_download_token" --scope project
```

---

## 4. Verify

- **Local:** With `EXPO_PUBLIC_MAPBOX_TOKEN` in `.env` and dev server restarted, open the map tab; you should see the Mapbox map, not the fallback list.
- **EAS build:** After adding the secret, run `eas build --platform all --profile production` again; in the new build the map should load.

---

## 5. Where the token is used

| File | Use |
|------|-----|
| `app.config.js` | Passes `EXPO_PUBLIC_MAPBOX_TOKEN` into `extra.mapboxAccessToken` so the app can read it at runtime. |
| `app/(tabs)/index.tsx` | Reads token from env or `Constants.expoConfig.extra.mapboxAccessToken`; if set and not web/Expo Go, shows Mapbox map; otherwise fallback. |
| `components/OrbTapMap.tsx` | `getMapboxToken()` reads env then config extra; calls `Mapbox.setAccessToken(token)`. |
| `services/mapboxGeocode.ts` | Geocoding API calls use the same token. |

`EXPO_PUBLIC_*` is intentionally public (it’s in the client). Use a **public** Mapbox token (not a secret token) and optionally restrict it by URL in the Mapbox dashboard.

---

## 6. Troubleshooting: “I see the fallback map instead of Mapbox”

1. **Token not set**  
   Add `EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxx` to `.env` (local) or as an EAS secret (builds). Restart the dev server after changing `.env` (`npx expo start --clear`).

2. **Running in Expo Go**  
   Mapbox requires native code and does **not** work in Expo Go. Use a development build: `npx expo run:ios` or `npx expo run:android`, or install a build from EAS.

3. **Web**  
   The map tab on web always shows a placeholder; Mapbox is only used in native builds.

4. **Map provider flag**  
   In the app, Settings (or Admin → Flags) may have a “Map provider” set to “native” or “none”. Set it to “Mapbox” so the app attempts to load the Mapbox map.

5. **Rebuild after adding token**  
   For EAS builds, the token is baked in at build time. Add the secret, then run a new build. For local dev, restart Metro after changing `.env`.
