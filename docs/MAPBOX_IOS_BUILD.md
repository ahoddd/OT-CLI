# Mapbox + iOS Simulator Build

The map uses **@rnmapbox/maps**, which requires **native code**. It does **not** work in Expo Go. Use a **development build** so the iOS simulator bundles and the map works.

## 1. Environment

Ensure `.env` in the project root has a Mapbox access token:

```
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```

Get a token at [Mapbox Account](https://account.mapbox.com/access-tokens/).

## 2. Clean and rebuild (recommended)

From the project root:

```bash
# Clear Metro cache and native build artifacts
npx expo start --clear --ios
```

**To get the map working**, use a **native build** (not Expo Go):

```bash
# Rebuild native iOS app with Mapbox linked (first time or after adding native deps)
npx expo prebuild --clean

# Build and run on iOS simulator (includes Mapbox native code)
npx expo run:ios
```

Use **`npx expo run:ios`** to run in the simulator with the map. Do **not** press `i` in the Expo dev server to open “Expo Go”; that environment doesn’t include Mapbox native code.

## 3. If the simulator still won’t bundle

1. **Clear everything and reinstall**

   ```bash
   rm -rf node_modules .expo ios android
   npm install
   npx expo prebuild --clean
   npx expo run:ios
   ```

2. **Confirm Mapbox token**

   - `.env` must contain `EXPO_PUBLIC_MAPBOX_TOKEN=...`
   - Restart the dev server after changing `.env`: `npx expo start --clear`

3. **Run iOS build again**

   ```bash
   npx expo run:ios
   ```

## 4. "Operation timed out" / openurl code 60

If you see:

```
Simulator device failed to open com.anonymous.orbtap://expo-development-client/?url=...
Operation timed out (code=60)
```

- **Cause:** iOS was using the Android package as a URL scheme; the simulator can time out opening that URL.
- **Fix applied:** `ios/OrbTap/Info.plist` now uses only the `orbtap` URL scheme (matching `app.json`). Rebuild and run:

  ```bash
  npx expo run:ios
  ```

- **If it still times out:**
  1. Quit the Simulator (File → Quit), then run `npx expo run:ios` again.
  2. Or start the app yourself: in the Simulator, tap the OrbTap icon. Then in the terminal run `npx expo start --clear` and the app will connect to Metro when it’s open.
  3. Or do a full clean rebuild: `npx expo prebuild --clean && npx expo run:ios`.

### Simulator: "exp://192.168.x.x:8081" timed out (code 60)

If you see:

```
Simulator device failed to open exp://192.168.x.x:8081
Operation timed out
```

- **Cause:** Expo is opening the dev server URL using your machine’s LAN IP; the simulator can be slow or unable to reach it in time.
- **Fix:** Use localhost so the simulator opens `exp://127.0.0.1:8081`:

  ```bash
  npm run start:ios
  ```

  Or:

  ```bash
  REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 npx expo start
  ```

  Then press `i` to open iOS, or run `npx expo run:ios` in another terminal. The app should connect without timing out.

## 5. Summary

| Goal                    | Command                 |
|-------------------------|-------------------------|
| Dev server + clear cache| `npx expo start --clear`|
| Run app **with map**    | `npx expo run:ios`      |
| Full clean + rebuild    | `npx expo prebuild --clean && npx expo run:ios` |

Expo Go will show the grid fallback when the map isn’t available; the real map only runs in a build started with `npx expo run:ios`.
