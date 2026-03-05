# Stripe Soft Launch — OrbTap Payments

**Purpose:** OrbTap must get paid for verified actions (partners) and for Premium/Pro memberships (users + partners). This doc defines the soft-launch payment strategy using Stripe.

---

## North Star

- **Partners** pay OrbTap for verified redemptions (per action or subscription).
- **Users** and **Partners** pay for Premium and Pro memberships; they must be able to subscribe and manage subscriptions easily.

---

## Recommended: Stripe at Soft Launch

Stripe is the recommended payment provider for OrbTap at soft launch because:

- Single integration for subscriptions (Premium/Pro) and one-time or usage-based partner billing.
- Stripe Customer Portal: users and partners can **manage subscriptions** (upgrade, cancel, update payment) without custom UI.
- Stripe Checkout: secure hosted payment pages; no PCI scope on OrbTap servers.
- Webhooks: sync subscription status to Firestore (`users/{uid}.tier`, `partners/{id}.plan`) and drive entitlements.

---

## 1. Premium & Pro Memberships (Users + Partners)

### Flow

1. User or Partner taps "Join Premium" / "Upgrade to Pro" in app.
2. App calls a Cloud Function (e.g. `createCheckoutSession`) with `priceId` (Stripe Price ID for the plan) and `successUrl` / `cancelUrl`.
3. Function creates a Stripe Checkout Session (mode: subscription) and returns `session.url`.
4. App opens the URL in browser or WebBrowser; user completes payment on Stripe.
5. On success, Stripe redirects to `successUrl` (e.g. orbtap.web.app/premium?session_id=...); app or web page can confirm and close.
6. Webhook `customer.subscription.created/updated/deleted` updates Firestore so the app shows the correct tier.

### Managing subscriptions

- Use **Stripe Customer Portal**. Create a Cloud Function `createBillingPortalSession` that creates a Stripe billing portal session and returns the URL.
- In-app: "Manage subscription" / "Billing" opens this URL so users and partners can update payment method, cancel, or change plan.

### Env / config

- `STRIPE_SECRET_KEY` (backend only)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional; if you add Stripe Elements later)
- Store Stripe Price IDs in Firestore `orbtapConfig/stripePrices` or in constants (e.g. Premium monthly, Pro monthly, partner tiers).

---

## 2. Partner Billing for Verified Actions

Partners pay OrbTap for verified redemptions (e.g. per scan or monthly cap).

### Options

- **Subscription:** Partner subscribes to a "Partner Pro" or "Verified actions" plan that includes N redemptions/month; overage billed or blocked.
- **Prepay / top-up:** Partner adds credit; each verified action deducts from balance (Stripe balance or Firestore ledger).
- **Invoice:** OrbTap runs a periodic job (e.g. weekly), sums verified actions per partner, and creates a Stripe Invoice or charges the partner’s default payment method.

At soft launch, the smallest path is: **Partner Pro subscription** that includes a set number of verified actions per month; no usage-based billing until needed.

---

## 3. Implementation Checklist (Soft Launch)

- [ ] Create Stripe account and get API keys.
- [ ] Add Cloud Functions: `createCheckoutSession`, `createBillingPortalSession`.
- [ ] Add webhook endpoint for `customer.subscription.*` and `invoice.*`; update Firestore `users/{uid}.tier` and `partners/{id}.plan`.
- [ ] In app: Premium/Pro screens open Checkout URL for "Join"; "Manage subscription" opens Billing Portal URL.
- [ ] Partner dashboard: "Billing" or "Pay OrbTap" opens Billing Portal or a dedicated partner billing page (Checkout/Portal).
- [ ] Document Price IDs and product names in Admin or `orbtapConfig`.

---

## 4. App Entry Points (Already Wired)

- **Premium screen** (`app/premium.tsx`): "Join Premium" → Checkout; when subscribed, "Manage subscription" → Billing Portal.
- **Pro screen** (`app/pro.tsx`): Same pattern.
- **Partner settings** (`app/(tabs)/partner-settings.tsx`): "Billing & payments" → Billing Portal or partner billing.
- **Settings / full-settings:** Optional "Manage subscription" link for logged-in users with Premium/Pro.

---

## 5. Legal & Store

- In-app purchases (IAP) via Apple/Google: if you offer Premium/Pro inside the app on iOS/Android, store rules may require IAP for digital goods. For soft launch, Stripe is typically used for web or for partner billing; user subscriptions may be via Stripe on web and IAP in app. See LegalContent and store policies.
- Privacy: do not store full card numbers; Stripe handles PCI. Store only Stripe Customer ID and subscription status in Firestore.

---

*OrbTap will not succeed if it never gets paid; this doc ensures easy ways to pay OrbTap and to manage Premium/Pro subscriptions.*
