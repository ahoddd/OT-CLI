/**
 * OrbTap Stripe Integration — Sprint 13 Revenue Activation.
 *
 * Exports:
 *   createCheckoutSession  — HTTPS callable: creates Stripe Checkout session for tier upgrade.
 *   createBillingPortal    — HTTPS callable: returns Stripe Customer Portal URL for subscription management.
 *   stripeWebhook          — HTTPS endpoint: receives Stripe events and writes tier to Firestore.
 *   reportOrbPilotVisit    — HTTPS callable: records a verified visit meter event for OrbPilot CPA billing.
 *
 * Firestore writes:
 *   users/{uid}.tier              — 'free' | 'premium' | 'pro'
 *   users/{uid}.tierExpiresISO    — ISO8601 subscription period end
 *   users/{uid}.stripeCustomerId  — customer ID for portal sessions
 *   partners/{partnerId}.tier     — 'silver' | 'gold' | 'platinum'
 *
 * Secret: ORPTAPSECRET (JSON: { env: { stripe_secret_key, stripe_webhook_secret } })
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const db = admin.firestore();
const ORPTAP_SECRET_ENV_KEY = 'ORPTAPSECRET';

function getSecretEnv(): Record<string, string> {
  try {
    const raw = process.env[ORPTAP_SECRET_ENV_KEY];
    if (raw) {
      const parsed = JSON.parse(raw) as { env?: Record<string, string> };
      return parsed?.env ?? {};
    }
  } catch { /* ignore */ }
  return {};
}

function getStripe(): Stripe {
  const env = getSecretEnv();
  const key = env['stripe_secret_key'] || process.env['STRIPE_SECRET_KEY'] || '';
  if (!key) throw new Error('stripe_secret_key not configured in ORPTAPSECRET');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

/** Maps Stripe price IDs (set via EXPO_PUBLIC env vars or ORPTAPSECRET) to user-facing tier. */
const PRICE_TO_TIER: Record<string, { accountType: 'user' | 'partner'; tier: string }> = {
  // User tiers — set real price IDs via ORPTAPSECRET env: stripe_price_user_premium_monthly, etc.
  [process.env['STRIPE_PRICE_USER_PREMIUM_MONTHLY'] || 'price_user_premium_monthly']: { accountType: 'user', tier: 'premium' },
  [process.env['STRIPE_PRICE_USER_PREMIUM_YEARLY'] || 'price_user_premium_yearly']: { accountType: 'user', tier: 'premium' },
  [process.env['STRIPE_PRICE_USER_PRO_MONTHLY'] || 'price_user_pro_monthly']: { accountType: 'user', tier: 'pro' },
  [process.env['STRIPE_PRICE_USER_PRO_YEARLY'] || 'price_user_pro_yearly']: { accountType: 'user', tier: 'pro' },
  // Partner tiers
  [process.env['STRIPE_PRICE_PARTNER_GOLD_MONTHLY'] || 'price_partner_gold_monthly']: { accountType: 'partner', tier: 'gold' },
  [process.env['STRIPE_PRICE_PARTNER_GOLD_YEARLY'] || 'price_partner_gold_yearly']: { accountType: 'partner', tier: 'gold' },
  [process.env['STRIPE_PRICE_PARTNER_PLATINUM_MONTHLY'] || 'price_partner_platinum_monthly']: { accountType: 'partner', tier: 'platinum' },
  [process.env['STRIPE_PRICE_PARTNER_PLATINUM_YEARLY'] || 'price_partner_platinum_yearly']: { accountType: 'partner', tier: 'platinum' },
};

/** Sync subscription → Firestore after any subscription lifecycle event. */
async function syncSubscriptionToFirestore(
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<void> {
  // Resolve UID from stripeCustomerId field in Firestore
  const snapshot = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    functions.logger.warn('syncSubscriptionToFirestore: no user found for customer', customerId);
    return;
  }

  const userDoc = snapshot.docs[0];
  const uid = userDoc.id;

  const status = subscription.status; // 'active' | 'canceled' | 'past_due' | etc.
  const priceId = subscription.items.data[0]?.price?.id ?? '';
  const tierInfo = PRICE_TO_TIER[priceId];
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  if (status === 'active' || status === 'trialing') {
    if (!tierInfo) {
      functions.logger.warn('syncSubscriptionToFirestore: unknown price ID', priceId);
      return;
    }

    if (tierInfo.accountType === 'user') {
      await userDoc.ref.update({
        tier: tierInfo.tier,
        tierExpiresISO: periodEnd,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      functions.logger.info('User tier updated', { uid, tier: tierInfo.tier });
    } else {
      // Partner tier — update the partner document linked to this user
      const partnerSnap = await db
        .collection('partners')
        .where('ownerUid', '==', uid)
        .limit(1)
        .get();
      if (!partnerSnap.empty) {
        await partnerSnap.docs[0].ref.update({
          tier: tierInfo.tier,
          tierExpiresISO: periodEnd,
          stripeSubscriptionId: subscription.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info('Partner tier updated', { uid, tier: tierInfo.tier });
      }
    }
  } else {
    // Subscription ended — revert to free tier
    await userDoc.ref.update({
      tier: 'free',
      tierExpiresISO: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info('User reverted to free tier', { uid, status });
  }
}

// ─── createCheckoutSession ────────────────────────────────────────────────────

interface CheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Optional: existing customer ID to avoid creating duplicates. */
  stripeCustomerId?: string;
}

export const createCheckoutSession = functions
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY], timeoutSeconds: 30 })
  .https.onCall(async (data: CheckoutSessionRequest, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    if (!data.priceId || !data.successUrl || !data.cancelUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'priceId, successUrl, and cancelUrl are required');
    }

    const stripe = getStripe();
    const uid = context.auth.uid;

    // Resolve or create Stripe customer
    let customerId = data.stripeCustomerId ?? '';
    if (!customerId) {
      const userSnap = await db.collection('users').doc(uid).get();
      customerId = (userSnap.data()?.stripeCustomerId as string) ?? '';
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { firebaseUid: uid },
        email: context.auth.token?.email,
      });
      customerId = customer.id;
      await db.collection('users').doc(uid).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: data.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
    });

    return { sessionId: session.id, url: session.url };
  });

// ─── createBillingPortal ──────────────────────────────────────────────────────

interface BillingPortalRequest {
  returnUrl: string;
}

export const createBillingPortal = functions
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY], timeoutSeconds: 30 })
  .https.onCall(async (data: BillingPortalRequest, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const stripe = getStripe();
    const uid = context.auth.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    const customerId = userSnap.data()?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new functions.https.HttpsError('not-found', 'No Stripe customer found for this account');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: data.returnUrl || 'https://orbtap.com',
    });

    return { url: session.url };
  });

// ─── stripeWebhook ────────────────────────────────────────────────────────────

export const stripeWebhook = functions
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY] })
  .https.onRequest(async (req, res) => {
    const env = getSecretEnv();
    const webhookSecret = env['stripe_webhook_secret'] || process.env['STRIPE_WEBHOOK_SECRET'] || '';
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      const sig = req.headers['stripe-signature'] as string;
      // req.rawBody is available in Firebase Functions (express wraps it)
      const body = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      functions.logger.error('Stripe webhook signature verification failed', err);
      res.status(400).send('Webhook Error: Invalid signature');
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;
          await syncSubscriptionToFirestore(subscription, customerId);
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.CheckoutSession;
          if (session.mode === 'subscription' && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
            );
            const customerId =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;
            await syncSubscriptionToFirestore(subscription, customerId);
          }
          break;
        }

        default:
          functions.logger.info('Unhandled Stripe event type', event.type);
      }
    } catch (err) {
      functions.logger.error('Error processing Stripe event', { type: event.type, err });
      res.status(500).send('Internal error');
      return;
    }

    res.json({ received: true });
  });

// ─── reportOrbPilotVisit ──────────────────────────────────────────────────────

interface OrbPilotVisitRequest {
  partnerId: string;
  /** CPA amount in dollars that was agreed in the campaign (client sends for audit trail, server verifies). */
  cpaDollars: number;
  visitId: string;
}

/**
 * Called on every verified OrbPilot visit — records billing meter event on partner's Stripe meter.
 * Partners are billed per-visit; OrbTap takes 30% platform fee.
 * Uses Stripe Billing Meters (or creates a usage record on a metered subscription item).
 */
export const reportOrbPilotVisit = functions
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY], timeoutSeconds: 30 })
  .https.onCall(async (data: OrbPilotVisitRequest, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    if (!data.partnerId || !data.visitId) {
      throw new functions.https.HttpsError('invalid-argument', 'partnerId and visitId are required');
    }

    const stripe = getStripe();

    // Fetch partner's Stripe subscription item ID for metered billing
    const partnerSnap = await db.collection('partners').doc(data.partnerId).get();
    const partnerData = partnerSnap.data();
    if (!partnerData) {
      throw new functions.https.HttpsError('not-found', 'Partner not found');
    }

    const stripeSubscriptionItemId = partnerData.stripeOrbPilotSubscriptionItemId as string | undefined;
    if (!stripeSubscriptionItemId) {
      // Partner hasn't set up OrbPilot billing yet — log but don't fail
      functions.logger.warn('OrbPilot visit: partner has no metered subscription item', data.partnerId);
      return { recorded: false, reason: 'no_billing_setup' };
    }

    // Idempotency key = visitId so we never double-charge
    await stripe.subscriptionItems.createUsageRecord(stripeSubscriptionItemId, {
      quantity: 1,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    }, {
      idempotencyKey: `orb_visit_${data.visitId}`,
    });

    // Write audit trail
    await db.collection('orbPilotBillingEvents').doc(data.visitId).set({
      partnerId: data.partnerId,
      visitId: data.visitId,
      cpaDollars: data.cpaDollars,
      stripeSubscriptionItemId,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      recordedBy: context.auth.uid,
    });

    functions.logger.info('OrbPilot visit recorded for billing', {
      partnerId: data.partnerId,
      visitId: data.visitId,
      cpaDollars: data.cpaDollars,
    });

    return { recorded: true };
  });
