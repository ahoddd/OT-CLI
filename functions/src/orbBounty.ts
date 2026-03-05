/**
 * OrbBounty™ — Deal Bounty Cloud Functions.
 * All mutations via callables; Firestore writes backend-only.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const BOUNTIES = 'bounties';
const BIDS = 'bids';
const ORBTAP_CONFIG = 'orbtapConfig';
const ORB_BOUNTY_DOC = 'orbBounty';
const PARTNERS = 'partners';
const BOUNTY_SETTINGS = 'bountySettings';
const BOUNTY_BID_RATE = 'bountyBidRateLimit';

type BountyStatus = 'open' | 'locked' | 'fulfilled' | 'expired' | 'cancelled';
type BidStatus = 'active' | 'withdrawn' | 'closed' | 'accepted';

interface OrbBountyConfig {
  enabled: boolean;
  stakeRules: { scoreUnder50Stake: number; score50to69Stake: number };
  maxActiveBountiesByTier: { free: number; premium: number; pro: number };
  ttlByCategorySeconds: Record<string, number>;
  partnerBidLimits: { perHour: number; perBounty: number };
  sanityWeights: { budget: number; radius: number; constraints: number; urgency: number };
  citiesEnabled?: string[];
}

const DEFAULT_CONFIG: OrbBountyConfig = {
  enabled: true,
  stakeRules: { scoreUnder50Stake: 50, score50to69Stake: 10 },
  maxActiveBountiesByTier: { free: 1, premium: 3, pro: 5 },
  ttlByCategorySeconds: { food: 86400, retail: 86400, services: 172800 },
  partnerBidLimits: { perHour: 10, perBounty: 1 },
  sanityWeights: { budget: 0.3, radius: 0.2, constraints: 0.25, urgency: 0.25 },
  citiesEnabled: [],
};

async function getConfig(): Promise<OrbBountyConfig> {
  const snap = await db.collection(ORBTAP_CONFIG).doc(ORB_BOUNTY_DOC).get();
  if (!snap.exists) return DEFAULT_CONFIG;
  const d = snap.data() as Record<string, unknown>;
  return {
    enabled: d?.enabled !== false,
    stakeRules: (d?.stakeRules as OrbBountyConfig['stakeRules']) ?? DEFAULT_CONFIG.stakeRules,
    maxActiveBountiesByTier: (d?.maxActiveBountiesByTier as OrbBountyConfig['maxActiveBountiesByTier']) ?? DEFAULT_CONFIG.maxActiveBountiesByTier,
    ttlByCategorySeconds: (d?.ttlByCategorySeconds as OrbBountyConfig['ttlByCategorySeconds']) ?? DEFAULT_CONFIG.ttlByCategorySeconds,
    partnerBidLimits: (d?.partnerBidLimits as OrbBountyConfig['partnerBidLimits']) ?? DEFAULT_CONFIG.partnerBidLimits,
    sanityWeights: (d?.sanityWeights as OrbBountyConfig['sanityWeights']) ?? DEFAULT_CONFIG.sanityWeights,
    citiesEnabled: Array.isArray(d?.citiesEnabled) ? (d.citiesEnabled as string[]) : DEFAULT_CONFIG.citiesEnabled,
  };
}

function computeSanityScore(params: {
  budgetMin: number;
  budgetMax: number;
  category: string;
  radiusMeters: number;
  ttlSeconds: number;
  constraintCount: number;
  weights: OrbBountyConfig['sanityWeights'];
}): number {
  const { budgetMin, budgetMax, category, radiusMeters, ttlSeconds, constraintCount, weights } = params;
  let score = 100;
  const baseline: Record<string, number> = { food: 15, retail: 25, services: 30 };
  const base = baseline[category] ?? 20;
  const mid = (budgetMin + budgetMax) / 2;
  if (mid < base * 0.5) score -= weights.budget * 25;
  else if (mid < base) score -= weights.budget * 10;
  if (radiusMeters < 500 && ttlSeconds < 3600) score -= weights.radius * 20;
  else if (radiusMeters < 1000) score -= weights.radius * 5;
  if (ttlSeconds < 1800) score -= weights.urgency * 15;
  else if (ttlSeconds < 7200) score -= weights.urgency * 5;
  if (constraintCount > 5) score -= weights.constraints * 20;
  else if (constraintCount > 3) score -= weights.constraints * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

const ADMIN_EMAILS_ORBBOUNTY = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminContext(context: functions.https.CallableContext): boolean {
  if (!context.auth) return false;
  const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
  return ADMIN_EMAILS_ORBBOUNTY.includes(email);
}

/** User tier for max active bounties (free/premium/pro). */
function getUserTier(context: functions.https.CallableContext): 'free' | 'premium' | 'pro' {
  const token = context.auth?.token as Record<string, unknown> | undefined;
  if (token?.premium === true) return 'premium';
  if (token?.pro === true || token?.partner === true) return 'pro';
  return 'free';
}

/** Check if uid has a partner doc (partners/{uid}) — treat as partner. */
async function isPartner(uid: string): Promise<{ isPartner: boolean; partnerName?: string }> {
  const snap = await db.collection(PARTNERS).doc(uid).get();
  if (!snap.exists) return { isPartner: false };
  const d = snap.data();
  const name = typeof d?.name === 'string' ? d.name : uid;
  return { isPartner: true, partnerName: name };
}

export const bountyCreate = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled) return { success: false, message: 'OrbBounty is not enabled.' };

    const d = data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== 'object') return { success: false, message: 'Payload required.' };

    const cityId = typeof d.cityId === 'string' ? d.cityId.trim() : 'default';
    if (config.citiesEnabled && config.citiesEnabled.length > 0 && !config.citiesEnabled.includes(cityId)) {
      return { success: false, message: 'Bounty not available in this city.' };
    }

    const geo = d.geo as { lat?: number; lng?: number } | undefined;
    const lat = typeof geo?.lat === 'number' ? geo.lat : 0;
    const lng = typeof geo?.lng === 'number' ? geo.lng : 0;
    const radiusMeters = Math.max(500, Math.min(50000, Number(d.radiusMeters) || 5000));
    const category = (d.category === 'food' || d.category === 'retail' || d.category === 'services') ? d.category : 'food';
    const budgetMin = Math.max(0, Number(d.budgetMin) ?? 0);
    const budgetMax = Math.max(budgetMin, Number(d.budgetMax) ?? 50);
    const ttlSeconds = Math.max(3600, Math.min(604800, Number(d.ttlSeconds) ?? config.ttlByCategorySeconds[category]));
    const privacy = (d.privacy === 'public' || d.privacy === 'friends' || d.privacy === 'private') ? d.privacy : 'public';
    const templateData = (d.templateData && typeof d.templateData === 'object') ? (d.templateData as Record<string, unknown>) : {};
    const constraintCount = Object.keys(templateData).length;

    const now = Date.now();
    const endAt = now + ttlSeconds * 1000;
    const timeWindow = { startAt: now, endAt };

    const sanityScore = computeSanityScore({
      budgetMin,
      budgetMax,
      category,
      radiusMeters,
      ttlSeconds,
      constraintCount,
      weights: config.sanityWeights,
    });

    let stakeRequired = false;
    let stakeAmount = 0;
    if (sanityScore < 50) {
      stakeRequired = true;
      stakeAmount = config.stakeRules.scoreUnder50Stake ?? 50;
    } else if (sanityScore >= 50 && sanityScore < 70) {
      stakeAmount = config.stakeRules.score50to69Stake ?? 10;
    }

    const tier = getUserTier(context);
    const maxActive = config.maxActiveBountiesByTier[tier] ?? 1;
    const activeSnap = await db.collection(BOUNTIES)
      .where('createdByUid', '==', uid)
      .where('status', 'in', ['open', 'locked'])
      .get();
    if (activeSnap.size >= maxActive) {
      return { success: false, message: `You can have at most ${maxActive} active bounty(ies). Complete or cancel one first.` };
    }

    const title = typeof d.title === 'string' ? d.title.trim() : `Bounty: ${category}`;
    const createdByDisplay = typeof d.createdByDisplay === 'string' ? d.createdByDisplay.trim() : undefined;

    const bountyRef = db.collection(BOUNTIES).doc();
    const bountyId = bountyRef.id;
    const bounty = {
      id: bountyId,
      createdAt: now,
      createdByUid: uid,
      createdByDisplay: createdByDisplay || null,
      cityId,
      geo: { lat, lng },
      radiusMeters,
      category,
      templateVersion: 1,
      title,
      budget: { min: budgetMin, max: budgetMax, currency: 'USD' as const },
      timeWindow,
      ttlSeconds,
      privacy,
      sanityScore,
      stakeRequired,
      stakeAmount,
      status: 'open' as BountyStatus,
      lockedPartnerId: null,
      lockedBidId: null,
      fulfillment: { pin: null, qrToken: null, verifiedAt: null, verifiedByPartnerId: null },
      metrics: { bidCount: 0, shareCount: 0, viewCount: 0 },
      templateData,
    };
    await bountyRef.set(bounty);
    return { success: true, bountyId, bounty: { ...bounty } };
  });

export const bountyGet = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled) return { success: false, message: 'OrbBounty is not enabled.' };

    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    if (!id) return { success: false, message: 'id required.' };

    const snap = await db.collection(BOUNTIES).doc(id).get();
    if (!snap.exists) return { success: false, message: 'Bounty not found.' };
    const bounty = snap.data()!;
    const now = Date.now();
    if (bounty.status === 'open' && bounty.timeWindow?.endAt && bounty.timeWindow.endAt < now) {
      await snap.ref.update({ status: 'expired' });
      bounty.status = 'expired';
    }
    const bidsSnap = await snap.ref.collection(BIDS).where('status', 'in', ['active', 'accepted']).orderBy('createdAt', 'desc').get();
    const bids = bidsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, bounty: { id: snap.id, ...bounty }, bids };
  });

export const bountyFeed = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled) return { success: true, bounties: [] };

    const d = data as Record<string, unknown> | null | undefined;
    const cityId = typeof d?.cityId === 'string' ? d.cityId.trim() : undefined;
    const category = (d?.category === 'food' || d?.category === 'retail' || d?.category === 'services') ? d.category : undefined;
    const highLikelihood = d?.highLikelihood === true;
    const limit = Math.min(50, Math.max(1, Number(d?.limit) || 20));

    let q = db.collection(BOUNTIES).where('status', '==', 'open').orderBy('createdAt', 'desc').limit(limit * 2);
    const snap = await q.get();

    const now = Date.now();
    const bounties: admin.firestore.DocumentData[] = [];
    let hasExpired = false;
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      const b = doc.data();
      if (b.timeWindow?.endAt && b.timeWindow.endAt < now) {
        batch.update(doc.ref, { status: 'expired' });
        hasExpired = true;
      } else {
        let include = true;
        if (cityId && b.cityId !== cityId) include = false;
        if (category && b.category !== category) include = false;
        if (highLikelihood && (typeof b.sanityScore !== 'number' || b.sanityScore < 70)) include = false;
        if (include) bounties.push({ id: doc.id, ...b });
      }
    });
    if (hasExpired) await batch.commit();
    return { success: true, bounties: bounties.slice(0, limit) };
  });

/** List bounties created by the current user (for "My Bounties" tab). */
export const bountyListMine = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled) return { success: true, bounties: [] };

    const d = data as Record<string, unknown> | null | undefined;
    const limit = Math.min(50, Math.max(1, Number(d?.limit) || 20));
    const snap = await db.collection(BOUNTIES)
      .where('createdByUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const bounties = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, bounties };
  });

export const bountyBid = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const { isPartner: isPartnerUser, partnerName } = await isPartner(uid);
    if (!isPartnerUser) return { success: false, message: 'Only partners can place bids. Link your partner account first.' };

    const config = await getConfig();
    if (!config.enabled) return { success: false, message: 'OrbBounty is not enabled.' };

    const d = data as Record<string, unknown> | null | undefined;
    const bountyId = typeof d?.bountyId === 'string' ? d.bountyId.trim() : '';
    if (!bountyId) return { success: false, message: 'bountyId required.' };

    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const bountySnap = await bountyRef.get();
    if (!bountySnap.exists) return { success: false, message: 'Bounty not found.' };
    const bounty = bountySnap.data()!;
    if (bounty.status !== 'open') return { success: false, message: 'Bounty is no longer open.' };

    const settingsSnap = await db.collection(PARTNERS).doc(uid).collection(BOUNTY_SETTINGS).doc('default').get();
    const settings = settingsSnap.data();
    const categoriesEnabled: string[] = Array.isArray(settings?.categoriesEnabled) ? settings.categoriesEnabled : [bounty.category];
    if (!categoriesEnabled.includes(bounty.category)) return { success: false, message: 'Your partner account is not enabled for this category.' };
    const minSanity = typeof settings?.minSanityScore === 'number' ? settings.minSanityScore : 0;
    if (bounty.sanityScore < minSanity) return { success: false, message: 'Bounty does not meet your minimum sanity filter.' };

    const rateLimitRef = db.collection(PARTNERS).doc(uid).collection(BOUNTY_BID_RATE).doc('hour');
    const rateSnap = await rateLimitRef.get();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const timestamps: number[] = (rateSnap.data()?.timestamps as number[]) || [];
    const recent = timestamps.filter((t) => t > oneHourAgo);
    const limit = typeof settings?.bidRateLimitPerHour === 'number' ? settings.bidRateLimitPerHour : config.partnerBidLimits.perHour;
    if (recent.length >= limit) return { success: false, message: `Rate limit: max ${limit} bids per hour.` };

    const existingBid = await bountyRef.collection(BIDS).where('partnerId', '==', uid).where('status', '==', 'active').limit(1).get();
    if (!existingBid.empty) return { success: false, message: 'You already have an active bid on this bounty.' };

    const terms = d?.terms as Record<string, unknown> | undefined;
    const headline = typeof terms?.headline === 'string' ? terms.headline.trim() : 'My offer';
    const details = typeof terms?.details === 'string' ? terms.details.trim() : '';
    const price = typeof terms?.price === 'number' ? terms.price : null;
    const discount = typeof terms?.discount === 'string' ? terms.discount.trim() : null;
    const addons = Array.isArray(terms?.addons) ? (terms.addons as string[]).slice(0, 5) : [];
    const expiresAt = Date.now() + (bounty.timeWindow?.endAt ? Math.max(0, bounty.timeWindow.endAt - Date.now()) : 86400000);

    const bidRef = bountyRef.collection(BIDS).doc();
    const bid = {
      id: bidRef.id,
      createdAt: Date.now(),
      partnerId: uid,
      partnerName: partnerName || uid,
      terms: { headline, details, price, discount, addons },
      expiresAt,
      status: 'active' as BidStatus,
      rankScore: 0,
    };
    await bidRef.set(bid);
    await bountyRef.update({
      'metrics.bidCount': FieldValue.increment(1),
    });
    await rateLimitRef.set({ timestamps: [...recent, Date.now()].slice(-limit * 2) }, { merge: true });
    return { success: true, bidId: bidRef.id, bid: { ...bid } };
  });

export const bountyAcceptBid = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;

    const d = data as Record<string, unknown> | null | undefined;
    const bountyId = typeof d?.bountyId === 'string' ? d.bountyId.trim() : '';
    const bidId = typeof d?.bidId === 'string' ? d.bidId.trim() : '';
    if (!bountyId || !bidId) return { success: false, message: 'bountyId and bidId required.' };

    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const bidRef = bountyRef.collection(BIDS).doc(bidId);

    return db.runTransaction(async (tx) => {
      const bountySnap = await tx.get(bountyRef);
      if (!bountySnap.exists) return { success: false, message: 'Bounty not found.' };
      const bounty = bountySnap.data()!;
      if (bounty.createdByUid !== uid) return { success: false, message: 'Only the bounty creator can accept a bid.' };
      if (bounty.status !== 'open') return { success: false, message: 'Bounty is no longer open.' };

      const bidSnap = await tx.get(bidRef);
      if (!bidSnap.exists) return { success: false, message: 'Bid not found.' };
      const bid = bidSnap.data()!;
      if (bid.status !== 'active') return { success: false, message: 'Bid is no longer active.' };
      if (bid.partnerId === undefined) return { success: false, message: 'Invalid bid.' };

      const pin = String(Math.floor(100000 + Math.random() * 900000));
      const qrToken = `bounty_${bountyId}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

      tx.update(bountyRef, {
        status: 'locked',
        lockedPartnerId: bid.partnerId,
        lockedBidId: bidId,
        'fulfillment.pin': pin,
        'fulfillment.qrToken': qrToken,
      });
      tx.update(bidRef, { status: 'accepted' });

      const otherBids = await tx.get(bountyRef.collection(BIDS).where('status', '==', 'active'));
      otherBids.docs.forEach((doc) => {
        if (doc.id !== bidId) tx.update(doc.ref, { status: 'closed' });
      });

      return { success: true, pin, qrToken, bountyId, bidId };
    });
  });

export const bountyVerifyFulfillment = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;

    const d = data as Record<string, unknown> | null | undefined;
    const bountyId = typeof d?.bountyId === 'string' ? d.bountyId.trim() : '';
    const pinOrToken = typeof d?.pin === 'string' ? d.pin.trim() : (typeof d?.qrToken === 'string' ? d.qrToken.trim() : '');
    if (!bountyId || !pinOrToken) return { success: false, message: 'bountyId and pin or qrToken required.' };

    const bountyRef = db.collection(BOUNTIES).doc(bountyId);

    return db.runTransaction(async (tx) => {
      const bountySnap = await tx.get(bountyRef);
      if (!bountySnap.exists) return { success: false, message: 'Bounty not found.' };
      const bounty = bountySnap.data()!;
      if (bounty.status !== 'locked') return { success: false, message: 'Bounty is not locked.' };
      if (bounty.lockedPartnerId !== uid) return { success: false, message: 'Only the accepted partner can verify fulfillment.' };

      const f = bounty.fulfillment || {};
      const pinMatch = f.pin === pinOrToken;
      const tokenMatch = f.qrToken === pinOrToken;
      if (!pinMatch && !tokenMatch) return { success: false, message: 'Invalid PIN or QR code.' };

      const lockedPartnerId = bounty.lockedPartnerId as string | undefined;
      let platformFeePercent = 10;
      if (lockedPartnerId) {
        const partnerSnap = await tx.get(db.collection(PARTNERS).doc(lockedPartnerId));
        const partnerTier = partnerSnap.exists ? (partnerSnap.data()?.tier as string) : undefined;
        if (partnerTier === 'gold' || partnerTier === 'platinum') platformFeePercent = 0;
      }

      const now = Date.now();
      const updateData: Record<string, unknown> = {
        status: 'fulfilled',
        'fulfillment.verifiedAt': now,
        'fulfillment.verifiedByPartnerId': uid,
        platformFeePercent,
      };
      tx.update(bountyRef, updateData);
      return { success: true, bountyId, fulfilledAt: now };
    });
  });

export const bountyDeleteBounty = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const adminCall = isAdminContext(context);

    const d = data as Record<string, unknown> | null | undefined;
    const bountyId = typeof d?.bountyId === 'string' ? d.bountyId.trim() : '';
    if (!bountyId) return { success: false, message: 'bountyId required.' };

    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const snap = await bountyRef.get();
    if (!snap.exists) return { success: false, message: 'Bounty not found.' };
    const bounty = snap.data()!;

    if (!adminCall && bounty.createdByUid !== uid) return { success: false, message: 'Only the creator or an admin can delete this bounty.' };
    if (bounty.status === 'fulfilled') return { success: false, message: 'Cannot delete a fulfilled bounty.' };

    await bountyRef.update({ status: 'cancelled' });
    return { success: true };
  });

/** Admin: list bounties (optional filter). */
export const bountyListAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };

    const d = data as Record<string, unknown> | null | undefined;
    const limit = Math.min(100, Math.max(1, Number(d?.limit) || 20));
    const status = typeof d?.status === 'string' ? d.status : undefined;

    let q = db.collection(BOUNTIES).orderBy('createdAt', 'desc').limit(limit);
    if (status) q = q.where('status', '==', status) as admin.firestore.Query;
    const snap = await q.get();
    const bounties = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, bounties };
  });
