# OrbTap — App Store & Google Play Readiness Checklist

Use this when submitting to **App Store Connect** and **Google Play Console**. Following this reduces the chance of reviewer rejection.

## Screenshots (App Store Connect)

- [ ] **13-inch iPad screenshots** uploaded: **2048 × 2732** (portrait) for iPad Pro 13-inch (3rd gen). See **[APP_STORE_IPAD_SCREENSHOTS.md](./APP_STORE_IPAD_SCREENSHOTS.md)** for how to capture them (Xcode Simulator: iPad Pro 13-inch, then **⌘+S** to save; images are the correct size).
- [ ] iPhone screenshots for all required device sizes (6.7", 6.5", etc.) as shown in App Store Connect.

## Age gate (required for reviewers)

- [ ] **Signup asks for date of birth** and **blocks users under 13** (or your minimum age). Implemented in signup: DOB fields + “I confirm I am at least 13 years old” checkbox; backend validates and stores age verification.
- [ ] If a user under 13 tries to register, they see a clear message and cannot proceed.
- [ ] No way to bypass the age check (client and server both validate).

## Legal & listing

- [ ] **Privacy Policy URL** in both store listings matches the in-app policy (e.g. `https://orbtap.com/legal/privacy` or your `EXPO_PUBLIC_PRIVACY_POLICY_URL`).
- [ ] **Terms of Service** (or "Terms of Use") linked in the app and, if required, in the store listing.
- [ ] **Contact / physical address** set: either `EXPO_PUBLIC_LEGAL_ADDRESS` in `.env` or a valid address in the store listing (Apple and Google expect this).
- [ ] **Help / Support** reachable in-app (Settings → Legal → Help Center, and/or Support).

## Data & privacy

- [ ] **Apple:** App Privacy "Nutrition Labels" in App Store Connect match the Privacy Policy (contact, location, identifiers, usage, etc.).
- [ ] **Google:** Data safety form declares the same data types and purposes; no selling of personal data; security practices described.

## In-app (reviewer-friendly)

- [ ] No visible "coming soon" or "TODO" in user-facing copy.
- [ ] All legal pages render full content (no placeholders).
- [ ] **Account deletion** is easy to find and works: **Settings → scroll to Data & Privacy / Danger Zone → Delete my account** → confirm → Data Deletion Request screen → submit and confirmation.
- [ ] **Terms and Privacy** are linked on the signup screen and in Settings so reviewers can verify compliance.
- [ ] **Login and logout** work on first use (no crash or blank screen).

## Functionality

- [ ] Sign up (with DOB and age confirmation), login, and logout work.
- [ ] Map, wallet, profile, partner/perk flows work for a regular user.
- [ ] If you have partner/premium roles, test one flow for each before submission.

## After submission

- [ ] Keep Privacy Policy and Terms URLs live and up to date.
- [ ] Respond to reviewer feedback promptly; reference this checklist and in-app paths if asked.
