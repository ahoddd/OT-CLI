# App Store screenshots — OrbTap

Screenshots are **uploaded in App Store Connect**, not included in the app binary. Use this folder to store prepared images and the specs below when capturing or resizing.

## Required formats

- **Formats:** JPEG (`.jpeg`, `.jpg`) or PNG (`.png`)
- **Count:** 1–10 screenshots per device size
- **Content:** No status bar required for most sizes; avoid placeholder or misleading UI.

## iPhone (required for OrbTap)

If you provide **only one size**, use the **largest** so Apple can scale down. Recommended minimum set:

| Display | Example devices | Portrait size (px) | Landscape (px) |
|---------|-----------------|-------------------|----------------|
| **6.9"** | iPhone 17 Pro Max, 16 Pro Max | 1320 × 2868 | 2868 × 1320 |
| **6.7"** | iPhone 15 Pro Max, 14 Pro Max | 1290 × 2796 | 2796 × 1290 |
| **6.5"** | iPhone 14 Plus, 13 Pro Max | 1284 × 2778 | 2778 × 1284 |
| **6.3"** | iPhone 15 Pro, 14 Pro | 1179 × 2556 | 2556 × 1179 |
| **6.1"** | iPhone 14, 13, 12 | 1170 × 2532 | 2532 × 1170 |

**Suggested:** Provide at least **6.7"** (1290 × 2796) or **6.9"** (1320 × 2868) portrait; others can be scaled by Apple if needed.

## iPad (if app supports iPad)

| Display | Portrait (px) | Landscape (px) |
|---------|----------------|----------------|
| **13"** | 2064 × 2752 | 2752 × 2064 |
| **12.9"** | 2048 × 2732 | 2732 × 2048 |
| **11"** | 1668 × 2388 | 2388 × 1668 |

## How to capture

1. Run the app in the **iOS Simulator** (e.g. iPhone 15 Pro Max for 6.7").
2. Take a screenshot: **Cmd + S** in Simulator, or device: **Side button + Volume up**.
3. Optionally resize/crop to exact pixels with an image tool.
4. Upload in **App Store Connect → App → App Store → [Version] → Screenshots** for the matching device size.

## What to show

- Main flows: map/home, partner list, tap/earn, redeem, profile.
- Real-looking content; no “Lorem ipsum” or broken placeholders.
- Same locale as the version’s primary language unless you add localizations.

Place final screenshot files in this folder for version control (e.g. `iphone-67-home.png`) and upload the same files to App Store Connect.

---

**Note:** Screenshots must be captured on your side (Simulator: **Cmd + S**, or device) and uploaded in App Store Connect. Automation cannot capture them from this environment.
