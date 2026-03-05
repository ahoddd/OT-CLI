# 13-inch iPad screenshots for App Store Connect

App Store Connect requires **iPad Pro 13-inch (3rd generation)** screenshots for the 12.9" iPad slot. Use these dimensions and methods to capture them.

## Required dimensions

| Orientation | Size (pixels) | Notes |
|-------------|---------------|--------|
| **Portrait**  | **2048 × 2732** | Required for iPad Pro 13-inch (3rd gen) |
| **Landscape** | **2732 × 2048** | Optional; use if your app is landscape-first |

Apple may also accept the same aspect ratio at 2x (4096 × 5464) for Retina. The 2048 × 2732 size is the standard reference.

## Method 1: Xcode Simulator (recommended)

1. Open **Xcode** and start the **iPad Pro 13-inch (3rd generation)** simulator:
   - **Window → Devices and Simulators** (or **Xcode → Open Developer Tool → Simulator**).
   - In Simulator menu: **File → Open Simulator → iPad Pro 13-inch (3rd generation)** (or choose it from the device list).
2. Run your app in the simulator:
   - From your project: `npx expo run:ios --device "iPad Pro 13-inch (3rd generation)"`  
   - Or open the built `.app` in the simulator.
3. Navigate to the screens you want to capture (e.g. home map, orb hub, profile, wallet).
4. Take a screenshot:
   - **⌘ + S** (Cmd + S), or  
   - **File → Save Screen** (in the Simulator menu).
   - Screenshots are saved to the **Desktop** by default (e.g. `Simulator Screen Shot - iPad Pro 13-inch (3rd generation) - 2025-02-14.png`).
5. The simulator screenshot is already at the correct resolution (2048 × 2732 for portrait).

## Method 2: Physical iPad Pro 12.9"

If you have a 12.9" iPad Pro:

1. Install the app on the device (TestFlight or development build).
2. Take a screenshot: **Side button + Volume up** (or **Home + Side** on older iPads).
3. Screenshots are in Photos. For App Store you may need to export at exact size:
   - Use **Preview** (Mac) or another tool to resize/crop to **2048 × 2732** (portrait) or **2732 × 2048** (landscape) if your device captured a different resolution.

## Method 3: Design tools (mockups)

If you prefer to use existing phone screenshots or designs:

1. Create a canvas **2048 × 2732** (portrait) in Figma, Sketch, or Photoshop.
2. Place your app screenshot or UI in the center; add device frame or leave full-bleed as Apple allows.
3. Export as PNG at 2048 × 2732.

## Uploading in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **App Store** tab.
2. Under **iPad** (or **12.9" iPad Pro**), open the screenshot section.
3. Upload the **2048 × 2732** (portrait) images. You can provide 3–10 screenshots.
4. Add optional landscape **2732 × 2048** if your app supports landscape and you want to show it.

## Checklist

- [ ] iPad Pro 13-inch (3rd gen) simulator installed (Xcode).
- [ ] App runs and looks correct on that simulator.
- [ ] Screenshots captured at **2048 × 2732** (portrait).
- [ ] Key flows visible: e.g. map/home, orb hub, profile, signup or login, wallet.
- [ ] No placeholder text like "Lorem ipsum" or "Coming soon" in the screenshots.
- [ ] Uploaded in App Store Connect under the correct iPad size slot.
