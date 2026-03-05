"use strict";
/**
 * OrbBounty™ — Deal Bounty Cloud Functions.
 * All mutations via callables; Firestore writes backend-only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bountyListAdmin = exports.bountyDeleteBounty = exports.bountyVerifyFulfillment = exports.bountyAcceptBid = exports.bountyBid = exports.bountyListMine = exports.bountyFeed = exports.bountyGet = exports.bountyCreate = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const BOUNTIES = 'bounties';
const BIDS = 'bids';
const ORBTAP_CONFIG = 'orbtapConfig';
const ORB_BOUNTY_DOC = 'orbBounty';
const PARTNERS = 'partners';
const BOUNTY_SETTINGS = 'bountySettings';
const BOUNTY_BID_RATE = 'bountyBidRateLimit';
const DEFAULT_CONFIG = {
    enabled: true,
    stakeRules: { scoreUnder50Stake: 50, score50to69Stake: 10 },
    maxActiveBountiesByTier: { free: 1, premium: 3, pro: 5 },
    ttlByCategorySeconds: { food: 86400, retail: 86400, services: 172800 },
    partnerBidLimits: { perHour: 10, perBounty: 1 },
    sanityWeights: { budget: 0.3, radius: 0.2, constraints: 0.25, urgency: 0.25 },
    citiesEnabled: [],
};
async function getConfig() {
    var _a, _b, _c, _d, _e;
    const snap = await db.collection(ORBTAP_CONFIG).doc(ORB_BOUNTY_DOC).get();
    if (!snap.exists)
        return DEFAULT_CONFIG;
    const d = snap.data();
    return {
        enabled: (d === null || d === void 0 ? void 0 : d.enabled) !== false,
        stakeRules: (_a = d === null || d === void 0 ? void 0 : d.stakeRules) !== null && _a !== void 0 ? _a : DEFAULT_CONFIG.stakeRules,
        maxActiveBountiesByTier: (_b = d === null || d === void 0 ? void 0 : d.maxActiveBountiesByTier) !== null && _b !== void 0 ? _b : DEFAULT_CONFIG.maxActiveBountiesByTier,
        ttlByCategorySeconds: (_c = d === null || d === void 0 ? void 0 : d.ttlByCategorySeconds) !== null && _c !== void 0 ? _c : DEFAULT_CONFIG.ttlByCategorySeconds,
        partnerBidLimits: (_d = d === null || d === void 0 ? void 0 : d.partnerBidLimits) !== null && _d !== void 0 ? _d : DEFAULT_CONFIG.partnerBidLimits,
        sanityWeights: (_e = d === null || d === void 0 ? void 0 : d.sanityWeights) !== null && _e !== void 0 ? _e : DEFAULT_CONFIG.sanityWeights,
        citiesEnabled: Array.isArray(d === null || d === void 0 ? void 0 : d.citiesEnabled) ? d.citiesEnabled : DEFAULT_CONFIG.citiesEnabled,
    };
}
function computeSanityScore(params) {
    var _a;
    const { budgetMin, budgetMax, category, radiusMeters, ttlSeconds, constraintCount, weights } = params;
    let score = 100;
    const baseline = { food: 15, retail: 25, services: 30 };
    const base = (_a = baseline[category]) !== null && _a !== void 0 ? _a : 20;
    const mid = (budgetMin + budgetMax) / 2;
    if (mid < base * 0.5)
        score -= weights.budget * 25;
    else if (mid < base)
        score -= weights.budget * 10;
    if (radiusMeters < 500 && ttlSeconds < 3600)
        score -= weights.radius * 20;
    else if (radiusMeters < 1000)
        score -= weights.radius * 5;
    if (ttlSeconds < 1800)
        score -= weights.urgency * 15;
    else if (ttlSeconds < 7200)
        score -= weights.urgency * 5;
    if (constraintCount > 5)
        score -= weights.constraints * 20;
    else if (constraintCount > 3)
        score -= weights.constraints * 10;
    return Math.max(0, Math.min(100, Math.round(score)));
}
const ADMIN_EMAILS_ORBBOUNTY = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminContext(context) {
    var _a, _b, _c;
    if (!context.auth)
        return false;
    const email = ((_c = (_b = (_a = context.auth.token) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b)) || '';
    return ADMIN_EMAILS_ORBBOUNTY.includes(email);
}
/** User tier for max active bounties (free/premium/pro). */
function getUserTier(context) {
    var _a;
    const token = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token;
    if ((token === null || token === void 0 ? void 0 : token.premium) === true)
        return 'premium';
    if ((token === null || token === void 0 ? void 0 : token.pro) === true || (token === null || token === void 0 ? void 0 : token.partner) === true)
        return 'pro';
    return 'free';
}
/** Check if uid has a partner doc (partners/{uid}) — treat as partner. */
async function isPartner(uid) {
    const snap = await db.collection(PARTNERS).doc(uid).get();
    if (!snap.exists)
        return { isPartner: false };
    const d = snap.data();
    const name = typeof (d === null || d === void 0 ? void 0 : d.name) === 'string' ? d.name : uid;
    return { isPartner: true, partnerName: name };
}
exports.bountyCreate = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'OrbBounty is not enabled.' };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    const cityId = typeof d.cityId === 'string' ? d.cityId.trim() : 'default';
    if (config.citiesEnabled && config.citiesEnabled.length > 0 && !config.citiesEnabled.includes(cityId)) {
        return { success: false, message: 'Bounty not available in this city.' };
    }
    const geo = d.geo;
    const lat = typeof (geo === null || geo === void 0 ? void 0 : geo.lat) === 'number' ? geo.lat : 0;
    const lng = typeof (geo === null || geo === void 0 ? void 0 : geo.lng) === 'number' ? geo.lng : 0;
    const radiusMeters = Math.max(500, Math.min(50000, Number(d.radiusMeters) || 5000));
    const category = (d.category === 'food' || d.category === 'retail' || d.category === 'services') ? d.category : 'food';
    const budgetMin = Math.max(0, (_a = Number(d.budgetMin)) !== null && _a !== void 0 ? _a : 0);
    const budgetMax = Math.max(budgetMin, (_b = Number(d.budgetMax)) !== null && _b !== void 0 ? _b : 50);
    const ttlSeconds = Math.max(3600, Math.min(604800, (_c = Number(d.ttlSeconds)) !== null && _c !== void 0 ? _c : config.ttlByCategorySeconds[category]));
    const privacy = (d.privacy === 'public' || d.privacy === 'friends' || d.privacy === 'private') ? d.privacy : 'public';
    const templateData = (d.templateData && typeof d.templateData === 'object') ? d.templateData : {};
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
        stakeAmount = (_d = config.stakeRules.scoreUnder50Stake) !== null && _d !== void 0 ? _d : 50;
    }
    else if (sanityScore >= 50 && sanityScore < 70) {
        stakeAmount = (_e = config.stakeRules.score50to69Stake) !== null && _e !== void 0 ? _e : 10;
    }
    const tier = getUserTier(context);
    const maxActive = (_f = config.maxActiveBountiesByTier[tier]) !== null && _f !== void 0 ? _f : 1;
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
        budget: { min: budgetMin, max: budgetMax, currency: 'USD' },
        timeWindow,
        ttlSeconds,
        privacy,
        sanityScore,
        stakeRequired,
        stakeAmount,
        status: 'open',
        lockedPartnerId: null,
        lockedBidId: null,
        fulfillment: { pin: null, qrToken: null, verifiedAt: null, verifiedByPartnerId: null },
        metrics: { bidCount: 0, shareCount: 0, viewCount: 0 },
        templateData,
    };
    await bountyRef.set(bounty);
    return { success: true, bountyId, bounty: Object.assign({}, bounty) };
});
exports.bountyGet = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'OrbBounty is not enabled.' };
    const d = data;
    const id = typeof (d === null || d === void 0 ? void 0 : d.id) === 'string' ? d.id.trim() : '';
    if (!id)
        return { success: false, message: 'id required.' };
    const snap = await db.collection(BOUNTIES).doc(id).get();
    if (!snap.exists)
        return { success: false, message: 'Bounty not found.' };
    const bounty = snap.data();
    const now = Date.now();
    if (bounty.status === 'open' && ((_a = bounty.timeWindow) === null || _a === void 0 ? void 0 : _a.endAt) && bounty.timeWindow.endAt < now) {
        await snap.ref.update({ status: 'expired' });
        bounty.status = 'expired';
    }
    const bidsSnap = await snap.ref.collection(BIDS).where('status', 'in', ['active', 'accepted']).orderBy('createdAt', 'desc').get();
    const bids = bidsSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, bounty: Object.assign({ id: snap.id }, bounty), bids };
});
exports.bountyFeed = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, bounties: [] };
    const d = data;
    const cityId = typeof (d === null || d === void 0 ? void 0 : d.cityId) === 'string' ? d.cityId.trim() : undefined;
    const category = ((d === null || d === void 0 ? void 0 : d.category) === 'food' || (d === null || d === void 0 ? void 0 : d.category) === 'retail' || (d === null || d === void 0 ? void 0 : d.category) === 'services') ? d.category : undefined;
    const highLikelihood = (d === null || d === void 0 ? void 0 : d.highLikelihood) === true;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    let q = db.collection(BOUNTIES).where('status', '==', 'open').orderBy('createdAt', 'desc').limit(limit * 2);
    const snap = await q.get();
    const now = Date.now();
    const bounties = [];
    let hasExpired = false;
    const batch = db.batch();
    snap.docs.forEach((doc) => {
        var _a;
        const b = doc.data();
        if (((_a = b.timeWindow) === null || _a === void 0 ? void 0 : _a.endAt) && b.timeWindow.endAt < now) {
            batch.update(doc.ref, { status: 'expired' });
            hasExpired = true;
        }
        else {
            let include = true;
            if (cityId && b.cityId !== cityId)
                include = false;
            if (category && b.category !== category)
                include = false;
            if (highLikelihood && (typeof b.sanityScore !== 'number' || b.sanityScore < 70))
                include = false;
            if (include)
                bounties.push(Object.assign({ id: doc.id }, b));
        }
    });
    if (hasExpired)
        await batch.commit();
    return { success: true, bounties: bounties.slice(0, limit) };
});
/** List bounties created by the current user (for "My Bounties" tab). */
exports.bountyListMine = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, bounties: [] };
    const d = data;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const snap = await db.collection(BOUNTIES)
        .where('createdByUid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    const bounties = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, bounties };
});
exports.bountyBid = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const { isPartner: isPartnerUser, partnerName } = await isPartner(uid);
    if (!isPartnerUser)
        return { success: false, message: 'Only partners can place bids. Link your partner account first.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'OrbBounty is not enabled.' };
    const d = data;
    const bountyId = typeof (d === null || d === void 0 ? void 0 : d.bountyId) === 'string' ? d.bountyId.trim() : '';
    if (!bountyId)
        return { success: false, message: 'bountyId required.' };
    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const bountySnap = await bountyRef.get();
    if (!bountySnap.exists)
        return { success: false, message: 'Bounty not found.' };
    const bounty = bountySnap.data();
    if (bounty.status !== 'open')
        return { success: false, message: 'Bounty is no longer open.' };
    const settingsSnap = await db.collection(PARTNERS).doc(uid).collection(BOUNTY_SETTINGS).doc('default').get();
    const settings = settingsSnap.data();
    const categoriesEnabled = Array.isArray(settings === null || settings === void 0 ? void 0 : settings.categoriesEnabled) ? settings.categoriesEnabled : [bounty.category];
    if (!categoriesEnabled.includes(bounty.category))
        return { success: false, message: 'Your partner account is not enabled for this category.' };
    const minSanity = typeof (settings === null || settings === void 0 ? void 0 : settings.minSanityScore) === 'number' ? settings.minSanityScore : 0;
    if (bounty.sanityScore < minSanity)
        return { success: false, message: 'Bounty does not meet your minimum sanity filter.' };
    const rateLimitRef = db.collection(PARTNERS).doc(uid).collection(BOUNTY_BID_RATE).doc('hour');
    const rateSnap = await rateLimitRef.get();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const timestamps = ((_a = rateSnap.data()) === null || _a === void 0 ? void 0 : _a.timestamps) || [];
    const recent = timestamps.filter((t) => t > oneHourAgo);
    const limit = typeof (settings === null || settings === void 0 ? void 0 : settings.bidRateLimitPerHour) === 'number' ? settings.bidRateLimitPerHour : config.partnerBidLimits.perHour;
    if (recent.length >= limit)
        return { success: false, message: `Rate limit: max ${limit} bids per hour.` };
    const existingBid = await bountyRef.collection(BIDS).where('partnerId', '==', uid).where('status', '==', 'active').limit(1).get();
    if (!existingBid.empty)
        return { success: false, message: 'You already have an active bid on this bounty.' };
    const terms = d === null || d === void 0 ? void 0 : d.terms;
    const headline = typeof (terms === null || terms === void 0 ? void 0 : terms.headline) === 'string' ? terms.headline.trim() : 'My offer';
    const details = typeof (terms === null || terms === void 0 ? void 0 : terms.details) === 'string' ? terms.details.trim() : '';
    const price = typeof (terms === null || terms === void 0 ? void 0 : terms.price) === 'number' ? terms.price : null;
    const discount = typeof (terms === null || terms === void 0 ? void 0 : terms.discount) === 'string' ? terms.discount.trim() : null;
    const addons = Array.isArray(terms === null || terms === void 0 ? void 0 : terms.addons) ? terms.addons.slice(0, 5) : [];
    const expiresAt = Date.now() + (((_b = bounty.timeWindow) === null || _b === void 0 ? void 0 : _b.endAt) ? Math.max(0, bounty.timeWindow.endAt - Date.now()) : 86400000);
    const bidRef = bountyRef.collection(BIDS).doc();
    const bid = {
        id: bidRef.id,
        createdAt: Date.now(),
        partnerId: uid,
        partnerName: partnerName || uid,
        terms: { headline, details, price, discount, addons },
        expiresAt,
        status: 'active',
        rankScore: 0,
    };
    await bidRef.set(bid);
    await bountyRef.update({
        'metrics.bidCount': FieldValue.increment(1),
    });
    await rateLimitRef.set({ timestamps: [...recent, Date.now()].slice(-limit * 2) }, { merge: true });
    return { success: true, bidId: bidRef.id, bid: Object.assign({}, bid) };
});
exports.bountyAcceptBid = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const bountyId = typeof (d === null || d === void 0 ? void 0 : d.bountyId) === 'string' ? d.bountyId.trim() : '';
    const bidId = typeof (d === null || d === void 0 ? void 0 : d.bidId) === 'string' ? d.bidId.trim() : '';
    if (!bountyId || !bidId)
        return { success: false, message: 'bountyId and bidId required.' };
    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const bidRef = bountyRef.collection(BIDS).doc(bidId);
    return db.runTransaction(async (tx) => {
        const bountySnap = await tx.get(bountyRef);
        if (!bountySnap.exists)
            return { success: false, message: 'Bounty not found.' };
        const bounty = bountySnap.data();
        if (bounty.createdByUid !== uid)
            return { success: false, message: 'Only the bounty creator can accept a bid.' };
        if (bounty.status !== 'open')
            return { success: false, message: 'Bounty is no longer open.' };
        const bidSnap = await tx.get(bidRef);
        if (!bidSnap.exists)
            return { success: false, message: 'Bid not found.' };
        const bid = bidSnap.data();
        if (bid.status !== 'active')
            return { success: false, message: 'Bid is no longer active.' };
        if (bid.partnerId === undefined)
            return { success: false, message: 'Invalid bid.' };
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
            if (doc.id !== bidId)
                tx.update(doc.ref, { status: 'closed' });
        });
        return { success: true, pin, qrToken, bountyId, bidId };
    });
});
exports.bountyVerifyFulfillment = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const bountyId = typeof (d === null || d === void 0 ? void 0 : d.bountyId) === 'string' ? d.bountyId.trim() : '';
    const pinOrToken = typeof (d === null || d === void 0 ? void 0 : d.pin) === 'string' ? d.pin.trim() : (typeof (d === null || d === void 0 ? void 0 : d.qrToken) === 'string' ? d.qrToken.trim() : '');
    if (!bountyId || !pinOrToken)
        return { success: false, message: 'bountyId and pin or qrToken required.' };
    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    return db.runTransaction(async (tx) => {
        var _a;
        const bountySnap = await tx.get(bountyRef);
        if (!bountySnap.exists)
            return { success: false, message: 'Bounty not found.' };
        const bounty = bountySnap.data();
        if (bounty.status !== 'locked')
            return { success: false, message: 'Bounty is not locked.' };
        if (bounty.lockedPartnerId !== uid)
            return { success: false, message: 'Only the accepted partner can verify fulfillment.' };
        const f = bounty.fulfillment || {};
        const pinMatch = f.pin === pinOrToken;
        const tokenMatch = f.qrToken === pinOrToken;
        if (!pinMatch && !tokenMatch)
            return { success: false, message: 'Invalid PIN or QR code.' };
        const lockedPartnerId = bounty.lockedPartnerId;
        let platformFeePercent = 10;
        if (lockedPartnerId) {
            const partnerSnap = await tx.get(db.collection(PARTNERS).doc(lockedPartnerId));
            const partnerTier = partnerSnap.exists ? (_a = partnerSnap.data()) === null || _a === void 0 ? void 0 : _a.tier : undefined;
            if (partnerTier === 'gold' || partnerTier === 'platinum')
                platformFeePercent = 0;
        }
        const now = Date.now();
        const updateData = {
            status: 'fulfilled',
            'fulfillment.verifiedAt': now,
            'fulfillment.verifiedByPartnerId': uid,
            platformFeePercent,
        };
        tx.update(bountyRef, updateData);
        return { success: true, bountyId, fulfilledAt: now };
    });
});
exports.bountyDeleteBounty = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const adminCall = isAdminContext(context);
    const d = data;
    const bountyId = typeof (d === null || d === void 0 ? void 0 : d.bountyId) === 'string' ? d.bountyId.trim() : '';
    if (!bountyId)
        return { success: false, message: 'bountyId required.' };
    const bountyRef = db.collection(BOUNTIES).doc(bountyId);
    const snap = await bountyRef.get();
    if (!snap.exists)
        return { success: false, message: 'Bounty not found.' };
    const bounty = snap.data();
    if (!adminCall && bounty.createdByUid !== uid)
        return { success: false, message: 'Only the creator or an admin can delete this bounty.' };
    if (bounty.status === 'fulfilled')
        return { success: false, message: 'Cannot delete a fulfilled bounty.' };
    await bountyRef.update({ status: 'cancelled' });
    return { success: true };
});
/** Admin: list bounties (optional filter). */
exports.bountyListAdmin = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const d = data;
    const limit = Math.min(100, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const status = typeof (d === null || d === void 0 ? void 0 : d.status) === 'string' ? d.status : undefined;
    let q = db.collection(BOUNTIES).orderBy('createdAt', 'desc').limit(limit);
    if (status)
        q = q.where('status', '==', status);
    const snap = await q.get();
    const bounties = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, bounties };
});
//# sourceMappingURL=orbBounty.js.map