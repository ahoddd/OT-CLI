# App Store & Play Store — Compliance and Updates

OrbTap is configured for current (2025) and near-term store requirements. This doc explains where to update versions and how to stay compliant.

## Current targets (as of Feb 2025)

| Platform | Setting | Value | Source |
|----------|---------|--------|--------|
| **iOS** | Deployment target | 15.1 | Apple: build with Xcode 16+ / iOS 18 SDK required from Apr 2025; minimum OS can stay 15.1 for compatibility. |
| **Android** | compileSdkVersion | 35 | Google: new apps/updates must target API 35 by Aug 31, 2025. |
| **Android** | targetSdkVersion | 35 | Same as above. |
| **Android** | minSdkVersion | 24 | Keeps support for older devices; raise only if you drop support. |

## Where versions are set

All of these are in **`app.config.js`** under the `expo-build-properties` plugin so one place controls native builds:

```js
[
  "expo-build-properties",
  {
    "android": {
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "minSdkVersion": 24,
      "kotlinVersion": "2.1.20"
    },
    "ios": {
      "deploymentTarget": "15.1",
      "useFrameworks": "static"
    }
  }
]
```

- **Android:** Play Store requirements are usually “target API N by date.” When Google raises the requirement (e.g. API 36), update `compileSdkVersion` and `targetSdkVersion` in the block above, then run prebuild (see below).
- **iOS:** Apple announces “build with Xcode N / iOS N SDK.” You build with that Xcode; you can keep `deploymentTarget` at 15.1 or bump it (e.g. to 16.0) when you want to drop older OS versions.

## Applying native changes

After changing `expo-build-properties` (or any native config):

```bash
npx expo prebuild --clean
```

Then build as usual (`expo run:ios`, `expo run:android`, or EAS Build). Without prebuild, existing `android/` and `ios/` folders keep their old values.

## App icon (dark logo for all users)

The app icon is the **main OrbTap logo in dark theme** for all users (no light-mode icon).

- **Source:** `assets/images/icon.png` is used for both the main icon and Android adaptive icon foreground.
- **Regenerating:** Put your main logo in `assets/images/logo-source.png` (dark version), then run:
  ```bash
  npm run generate-icons
  ```
  This overwrites `icon.png`, `adaptive-icon.png`, and `favicon.png` with a black background. Replace `icon.png` with the output so the app icon stays the dark logo everywhere.

## Checklist for future store updates

1. Check [Apple’s upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) and [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
2. In **`app.config.js`**, update the `expo-build-properties` block:
   - Android: `compileSdkVersion`, `targetSdkVersion` (and optionally `minSdkVersion`).
   - iOS: `deploymentTarget` if you want to raise the minimum OS.
3. Run **`npx expo prebuild --clean`**.
4. Build and test, then submit to the stores.

## References

- [Expo build-properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- [Apple — Submitting](https://developer.apple.com/app-store/submitting/)
- [Google Play — Target API level](https://support.google.com/googleplay/android-developer/answer/11926878)
