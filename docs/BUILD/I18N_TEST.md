# OrbTap i18n — Manual test checklist

## 1. Device language → app language

- [ ] Set iPhone (or simulator) language to **Spanish** (Settings → General → Language & Region).
- [ ] Open OrbTap (cold start). UI should show Spanish (e.g. login: “Entrar”, “Atrás”, “Correo”, etc.).
- [ ] Set device language to **Arabic**. Open OrbTap. UI should show Arabic.

## 2. Arabic RTL

- [ ] With app in Arabic, tap **Restart now** when prompted (or restart app manually).
- [ ] After restart, layout should be RTL (e.g. back button on right, text aligned right where applicable).
- [ ] No broken layout (no overlapping or clipped text).

## 3. Missing key fallback

- [ ] In code, temporarily use a key that does not exist in any locale, e.g. `t('fake.unknownKey')`.
- [ ] App should not crash; English fallback or the key itself may show. In __DEV__, a console warning about the missing key is expected.

## 4. Settings language override

- [ ] Open **Settings** → **Language**.
- [ ] Select **Español**. UI (e.g. Settings tabs, labels) should switch to Spanish immediately.
- [ ] Select **System Default**. UI should follow device language again.
- [ ] Force-close app and reopen. Selected language should persist (e.g. still Spanish if that was last chosen).

## 5. TypeScript / build

- [ ] Run `npm run typecheck`. No new TypeScript errors.
- [ ] App builds and runs without errors.

## Optional

- [ ] Test **French**, **Portuguese**, **German**, **Italian**, **Hindi** from Settings → Language and confirm labels update.
