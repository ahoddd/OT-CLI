# Expo Go "Incompatible version" fix

Your project uses **Expo SDK 52**. The Expo Go app on your device is **SDK 54**. You can fix this in one of two ways:

---

## Option 1: Use the iOS Simulator (quick, no upgrade)

1. **Install Expo Go for SDK 52 in the iOS Simulator**
   - Open: https://expo.dev/go?sdkVersion=52&platform=ios&device=false  
   - Download and install the SDK 52 build in your simulator.

2. **Start the dev server and open in simulator**
   ```bash
   npx expo start
   ```
   Then press **`i`** to open in the iOS Simulator (or scan the QR code from the simulator’s Expo Go).

Your app will run in the simulator with SDK 52 and no project changes.

---

## Option 2: Upgrade the project to SDK 54

To use Expo Go on your **physical device** (SDK 54), upgrade the project:

1. **Install Expo 54 and fix dependencies**
   ```bash
   npm install expo@54
   npx expo install --fix
   npx expo-doctor
   ```

2. **If you have an `ios/` folder** (native build)
   - Either delete `ios/` and run `npx expo prebuild` (or `npx expo run:ios`) to regenerate,  
   - Or run `npx pod-install` and apply any changes from the [Native upgrade helper](https://docs.expo.dev/bare/upgrade).

3. **Restart the dev server**
   ```bash
   npx expo start --clear
   ```

SDK 54 uses React Native 0.81 and React 19; check [Expo SDK 54 release notes](https://expo.dev/changelog/sdk-54) for breaking changes.
