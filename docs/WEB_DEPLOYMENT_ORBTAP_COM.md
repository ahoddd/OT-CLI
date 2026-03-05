# OrbTap Web — Deploy to www.orbtap.com

This guide gets the OrbTap web app built and deployed so **www.orbtap.com** serves it.

## Prerequisites

- Node 18+
- Expo CLI / project deps installed (`npm install`)
- Firebase project (orbtap) with Hosting enabled
- Domain **orbtap.com** pointed to your hosting (see step 4)

## 1. Environment for web

Create or update `.env` (and EAS/CI if you use it) so the web build uses your production URL:

```bash
EXPO_PUBLIC_APP_LINK=https://www.orbtap.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://www.orbtap.com/legal/privacy
EXPO_PUBLIC_TERMS_URL=https://www.orbtap.com/legal/terms
```

Optional: set `EXPO_PUBLIC_LEGAL_ADDRESS` for legal pages.

## 2. Build the web app

From the project root:

```bash
cd /path/to/OT-CLI
npm run export:web
```

This runs `expo export --platform web` and writes the static output to **`dist/`** (or the path shown in the Expo output). Note that path for the next step.

If the command fails (e.g. missing web deps), run:

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

then try `npm run export:web` again.

## 3. Deploy to Firebase Hosting

### One-time: Firebase Hosting setup

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

- Choose your existing Firebase project (orbtap).
- Set **public directory** to the folder Expo wrote to (e.g. `dist`).
- Configure as a **single-page app** (yes) if asked.
- Do not overwrite `index.html` if you already have one from Expo.

Ensure **firebase.json** has a rewrite so all routes serve `index.html` (Expo Router is client-side):

```json
"hosting": {
  "public": "dist",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
  "rewrites": [{ "source": "**", "destination": "/index.html" }]
}
```

### Deploy

```bash
npm run export:web
firebase deploy --only hosting
```

Your app will be live at the default Hosting URL (e.g. `https://orbtap.web.app`).

## 4. Custom domain: www.orbtap.com

1. In [Firebase Console](https://console.firebase.google.com) → your project → **Hosting** → **Add custom domain**.
2. Enter **www.orbtap.com** (or **orbtap.com** and add both if you want).
3. Follow the steps to add the DNS records (A/CNAME and TXT) at your domain registrar.
4. After verification, Firebase will serve the same Hosting content for **www.orbtap.com**.

Optional: at your registrar, add a redirect from **orbtap.com** → **https://www.orbtap.com** so both work.

## 5. Verify

- Open **https://www.orbtap.com** and confirm the app loads.
- Test auth (login/signup), legal pages (**/legal/privacy**, **/legal/terms**), and key flows.
- On web, the **Map** tab shows a placeholder that directs users to the mobile app; the rest of the app (wallet, profile, legal, etc.) works in the browser.

## 6. Ongoing updates

After code or env changes:

```bash
npm run export:web
firebase deploy --only hosting
```

Keep **EXPO_PUBLIC_APP_LINK** (and legal URLs) set to **https://www.orbtap.com** so links and OAuth redirects stay correct.

## Troubleshooting

- **Blank page**: Check the browser console and ensure the build output path matches the Hosting “public” directory.
- **Wrong links**: Ensure `.env` has `EXPO_PUBLIC_APP_LINK=https://www.orbtap.com` and rebuild.
- **Map not loading**: Expected on web; the map is native and the web build shows a “Get the app” placeholder.
