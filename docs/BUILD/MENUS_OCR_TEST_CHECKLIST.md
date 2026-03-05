# Partner Menu OCR — Manual Test Checklist

Use this checklist to verify the Partner Menu OCR → Review → Publish flow and conversion hooks.

---

## Prerequisites

- Feature flags: ensure `partnerMenusEnabled` is ON (default). Optionally turn on/off `partnerMenusReporting`, `partnerMenusTonightPicks`, `partnerMenusDropSuggestions` to test gating.
- Partner dashboard: navigate as partner (e.g. mock partner `p1`).
- **Deployment:** For photo upload and OCR to work: deploy Storage rules (`firebase deploy --only storage`), deploy Cloud Functions including `menuOcrFromUrls` (`firebase deploy --only functions`), and enable the Cloud Vision API on the Firebase/GCP project. Menu images are resized client-side (max width 1600px, JPEG 80%) before upload for faster uploads.

---

## 1) Capture / upload → OCR → draft in editor

- [ ] From **Partner Dashboard**, tap **Manage menu** (under PARTNER MENU).
- [ ] On **Manage Menu** screen, tap **Upload menu** (or "Upload new menu (replace)" if a menu exists).
- [ ] **Paste text**: switch to "Paste text", enter sample menu e.g.:
  ```
  APPETIZERS
  Caesar Salad $9.99
  Wings $12.00

  ENTREES
  Grilled Salmon $18.00
  Burger $14.99
  ```
  Tap **Parse & Edit**. Confirm you are taken to the **Review Menu** editor with sections (APPETIZERS, ENTREES) and items with prices.
- [ ] **Photos**: switch to "Photos", add 1–6 images (camera or library). Tap **Upload & Continue**. Confirm draft is created and you land in the editor (placeholder items if no on-device OCR; you can edit them).

---

## 2) Review editor: edit, reorder, tags, Tonight Pick, Publish

- [ ] In **Review Menu**, expand a section. Change an item **name**, **description**, **price**.
- [ ] Add **tags** (e.g. veg, vegan, gluten-free) via chips.
- [ ] Toggle **Available** off for one item.
- [ ] If `partnerMenusTonightPicks` is on: toggle **Tonight Pick** on for one or two items.
- [ ] If `partnerMenusDropSuggestions` is on: toggle **Drop suggestion** and tap **Create Drop from item**. Confirm "Coming soon" alert and that a draft is stored.
- [ ] Tap **Publish**. Confirm alert and redirect to **Manage Menu**.
- [ ] On Manage Menu, confirm status shows **PUBLISHED** and **Verified** and version summary.

---

## 3) Verified Menu on partner page

- [ ] Open the **partner’s public page** (e.g. partner `p1`).
- [ ] Confirm a **MENU** section appears above DEALS & PERKS.
- [ ] Confirm **Verified Menu** badge when menu is published and verified.
- [ ] Confirm **Tonight Picks** carousel when at least one item has Tonight Pick and flag is on.
- [ ] Confirm **Search** filters items by name/description.
- [ ] Confirm **Price filters** (All, Under $10, Under $20, Under $30) and **tag filters** work.
- [ ] Confirm each item row shows name, description, price, and optional tag chips.

---

## 4) Versioning

- [ ] From Manage Menu, tap **Edit menu**. Make a small change (e.g. edit one price). Save (back) without publishing.
- [ ] Tap **Publish** again (or make a change and Publish). Confirm a new version is created.
- [ ] On Manage Menu, confirm **Version history** lists prior versions with date/summary.

---

## 5) User report flow

- [ ] On partner page **MENU** section, tap **Report an issue with this menu**.
- [ ] Select category (e.g. Wrong price). Enter details with **≥10 characters**. Submit.
- [ ] Confirm modal closes and (in a full flow) report is stored.
- [ ] Optionally tap the small flag on an item row to report that item; submit with ≥10 chars.

---

## 6) Auto-flag NEEDS_REVIEW and badges

- [ ] Create **≥3 OPEN reports** for the same menu within 14 days (or **≥2 WRONG_PRICE** reports on the same item). Use multiple report submissions if needed.
- [ ] Confirm menu status becomes **NEEDS_REVIEW** (partner dashboard / Manage Menu).
- [ ] On **partner public page**, confirm **Needs Review** or **Menu may be outdated** badge as designed.
- [ ] In **Admin Hub → System**, confirm **Menus needing review** lists the partner and report count / last report.

---

## 7) Tonight Picks in Tonight surface

- [ ] With `partnerMenusTonightPicks` on and at least one menu item marked Tonight Pick and published, open the **Tonight** tab/screen.
- [ ] Confirm **Tonight Picks** include tiles like "[Item name] at [Partner name]" that deep-link to the partner page.

---

## 8) No regressions

- [ ] No new crashes on partner dashboard, partner page, Manage Menu, Upload, Edit, Admin Hub.
- [ ] No "not found" or broken routes for `/partner/menu`, `/partner/menu/upload`, `/partner/menu/edit`.
- [ ] No new TypeScript/build errors introduced.

---

## Platform-specific OCR notes

- **v1 implementation**: No native on-device OCR library is wired. **Manual entry** (paste menu text) uses the same heuristic parser and produces a draft; **photos** are uploaded to storage and a placeholder draft is created so partners can edit and publish. To add real OCR later:
  - **iOS**: Use Vision (VNRecognizeTextRequest) via a React Native bridge or community package.
  - **Android**: Use ML Kit Text Recognition (on-device) via RN library.
- **Confidence & cloud fallback**: `parseMenuFromText` returns a confidence score; `partnerMenusOcrCloudFallback` is OFF by default. When a native OCR path is added, feed its text into the same parser and gate cloud fallback by flag when confidence &lt; 0.55.

---

*Reference: Integration Map — `docs/BUILD/MENUS_OCR_INTEGRATION_MAP.md`*
