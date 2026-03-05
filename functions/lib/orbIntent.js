"use strict";
/**
 * OrbIntent™ Protocol — Cloud Functions.
 * All mutations via callables; Firestore writes backend-only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrbIntentUpdateConfig = exports.adminOrbIntentMetrics = exports.dealDoneGet = exports.ruleRunNow = exports.ruleList = exports.ruleUpdate = exports.ruleCreate = exports.intentVerifyFulfillment = exports.intentAcceptOffer = exports.intentOffer = exports.intentListForPartner = exports.intentListMine = exports.intentFeed = exports.intentGet = exports.intentCreate = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const INTENTS = 'intents';
const OFFERS = 'offers';
const RULES = 'rules';
const DEAL_DONE_CARDS = 'dealDoneCards';
const ORBTAP_CONFIG = 'orbtapConfig';
const ORB_INTENT_DOC = 'orbIntent';
const PARTNERS = 'partners';
const INTENT_SETTINGS = 'intentSettings';
const INTENT_OFFER_RATE = 'intentOfferRateLimit';
const ORB_INTENT_EVENTS = 'orbIntentEvents';
const DEFAULT_CONFIG = {
    enabled: false,
    citiesEnabled: [],
    categoriesEnabled: ['food', 'retail', 'services', 'nightlife', 'appointment'],
    offerDeadlineDefaultsSeconds: { food: 3600, retail: 3600, services: 7200, nightlife: 3600, appointment: 86400 },
    fulfillmentDeadlineDefaultsSeconds: { food: 86400, retail: 86400, services: 172800, nightlife: 43200, appointment: 172800 },
    intentScoringWeights: { budget: 0.25, radius: 0.2, constraints: 0.25, urgency: 0.2, flexibility: 0.1 },
    gatingRules: { scoreUnder50Stake: 50, score50to69Stake: 10, minScoreToRouteToPartners: 50 },
    quotas: { maxOpenIntentsFree: 2, maxOpenIntentsPremium: 5, maxOpenIntentsPro: 10 },
    ruleEngine: { maxRulesPerUserFree: 0, maxRulesPerUserPremium: 3, maxRulesPerUserPro: 10 },
    autoAcceptPolicy: { allowAutoAccept: true, defaultGraceSeconds: 300, minPartnerTrustScore: 70 },
    partnerLimits: { offersPerHour: 20, offersPerIntent: 1 },
    rankingWeights: { value: 0.4, trust: 0.3, distance: 0.2, speed: 0.1 },
    emergencyKill: { disableRouting: false, disableOffers: false, disableAutoAccept: false },
};
async function getConfig() {
    const snap = await db.collection(ORBTAP_CONFIG).doc(ORB_INTENT_DOC).get();
    if (!snap.exists)
        return DEFAULT_CONFIG;
    const d = snap.data();
    return {
        enabled: (d === null || d === void 0 ? void 0 : d.enabled) === true,
        citiesEnabled: Array.isArray(d === null || d === void 0 ? void 0 : d.citiesEnabled) ? d.citiesEnabled : DEFAULT_CONFIG.citiesEnabled,
        categoriesEnabled: Array.isArray(d === null || d === void 0 ? void 0 : d.categoriesEnabled) ? d.categoriesEnabled : DEFAULT_CONFIG.categoriesEnabled,
        offerDeadlineDefaultsSeconds: Object.assign(Object.assign({}, DEFAULT_CONFIG.offerDeadlineDefaultsSeconds), d === null || d === void 0 ? void 0 : d.offerDeadlineDefaultsSeconds),
        fulfillmentDeadlineDefaultsSeconds: Object.assign(Object.assign({}, DEFAULT_CONFIG.fulfillmentDeadlineDefaultsSeconds), d === null || d === void 0 ? void 0 : d.fulfillmentDeadlineDefaultsSeconds),
        intentScoringWeights: Object.assign(Object.assign({}, DEFAULT_CONFIG.intentScoringWeights), d === null || d === void 0 ? void 0 : d.intentScoringWeights),
        gatingRules: Object.assign(Object.assign({}, DEFAULT_CONFIG.gatingRules), d === null || d === void 0 ? void 0 : d.gatingRules),
        quotas: Object.assign(Object.assign({}, DEFAULT_CONFIG.quotas), d === null || d === void 0 ? void 0 : d.quotas),
        ruleEngine: Object.assign(Object.assign({}, DEFAULT_CONFIG.ruleEngine), d === null || d === void 0 ? void 0 : d.ruleEngine),
        autoAcceptPolicy: Object.assign(Object.assign({}, DEFAULT_CONFIG.autoAcceptPolicy), d === null || d === void 0 ? void 0 : d.autoAcceptPolicy),
        partnerLimits: Object.assign(Object.assign({}, DEFAULT_CONFIG.partnerLimits), d === null || d === void 0 ? void 0 : d.partnerLimits),
        rankingWeights: Object.assign(Object.assign({}, DEFAULT_CONFIG.rankingWeights), d === null || d === void 0 ? void 0 : d.rankingWeights),
        emergencyKill: Object.assign(Object.assign({}, DEFAULT_CONFIG.emergencyKill), d === null || d === void 0 ? void 0 : d.emergencyKill),
    };
}
function getUserTier(context) {
    var _a;
    const token = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token;
    if ((token === null || token === void 0 ? void 0 : token.premium) === true)
        return 'premium';
    if ((token === null || token === void 0 ? void 0 : token.pro) === true || (token === null || token === void 0 ? void 0 : token.partner) === true)
        return 'pro';
    return 'free';
}
async function isPartner(uid) {
    const snap = await db.collection(PARTNERS).doc(uid).get();
    if (!snap.exists)
        return { isPartner: false };
    const d = snap.data();
    return { isPartner: true, partnerName: typeof (d === null || d === void 0 ? void 0 : d.name) === 'string' ? d.name : uid };
}
function getPartnerTrustScore(partnerId) {
    return db.collection(PARTNERS).doc(partnerId).get().then((snap) => {
        var _a;
        const t = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.trust;
        return typeof (t === null || t === void 0 ? void 0 : t.score) === 'number' ? t.score : 50;
    });
}
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminContext(context) {
    var _a, _b, _c;
    if (!context.auth)
        return false;
    const email = ((_c = (_b = (_a = context.auth.token) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b)) || '';
    return ADMIN_EMAILS.includes(email);
}
async function recordEvent(type, intentId, actorUid, partnerId, metadata) {
    await db.collection(ORB_INTENT_EVENTS).add({
        ts: FieldValue.serverTimestamp(),
        type,
        intentId,
        actorUid,
        partnerId: partnerId !== null && partnerId !== void 0 ? partnerId : null,
        metadata: metadata !== null && metadata !== void 0 ? metadata : {},
    });
}
function computeIntentScore(params) {
    var _a;
    const { budgetMin, budgetMax, category, radiusMeters, offerDeadlineSeconds, constraintCount, flexibility, weights } = params;
    const base = { food: 15, retail: 25, services: 30, nightlife: 20, appointment: 40 };
    const b = (_a = base[category]) !== null && _a !== void 0 ? _a : 20;
    let score = 100;
    const mid = (budgetMin + budgetMax) / 2;
    if (mid < b * 0.5)
        score -= weights.budget * 30;
    else if (mid < b)
        score -= weights.budget * 12;
    if (radiusMeters < 500 && offerDeadlineSeconds < 3600)
        score -= weights.radius * 25;
    else if (radiusMeters < 1000)
        score -= weights.radius * 8;
    if (offerDeadlineSeconds < 1800)
        score -= weights.urgency * 20;
    else if (offerDeadlineSeconds < 3600)
        score -= weights.urgency * 8;
    if (constraintCount > 5)
        score -= weights.constraints * 25;
    else if (constraintCount > 3)
        score -= weights.constraints * 12;
    if (flexibility >= 0.5 && flexibility <= 0.8)
        score += weights.flexibility * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
}
/** Create intent. */
exports.intentCreate = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'Deal Match is not enabled.' };
    if (config.emergencyKill.disableRouting)
        return { success: false, message: 'Intent creation is temporarily disabled.' };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    const cityId = typeof d.cityId === 'string' ? d.cityId.trim() : 'default';
    if (config.citiesEnabled && config.citiesEnabled.length > 0 && !config.citiesEnabled.includes(cityId)) {
        return { success: false, message: 'Intent not available in this city.' };
    }
    const category = (['food', 'retail', 'services', 'nightlife', 'appointment'].includes(String(d.category)) ? d.category : 'food');
    if (!config.categoriesEnabled.includes(category))
        return { success: false, message: 'Category not enabled.' };
    const budgetMin = Math.max(0, Number(d.budgetMin) || 0);
    const budgetMax = Math.max(budgetMin, Number(d.budgetMax) || 50);
    const radiusMeters = Math.max(500, Math.min(50000, Number(d.radiusMeters) || 5000));
    const offerDeadlineSeconds = Math.max(600, Math.min(604800, Number(d.offerDeadlineSeconds) || 3600));
    const fulfillmentDeadlineSeconds = Math.max(offerDeadlineSeconds, Math.min(1209600, Number(d.fulfillmentDeadlineSeconds) || 86400));
    const flexibility = Math.max(0, Math.min(1, (_a = Number(d.flexibility)) !== null && _a !== void 0 ? _a : 0.5));
    const privacy = (['public', 'friends', 'private'].includes(String(d.privacy)) ? d.privacy : 'public');
    const title = typeof d.title === 'string' ? d.title.trim() : '';
    if (!title)
        return { success: false, message: 'Title required.' };
    const templateData = (d.templateData && typeof d.templateData === 'object') ? d.templateData : {};
    const constraintCount = Object.keys(templateData).length;
    const intentScore = computeIntentScore({
        budgetMin, budgetMax, category, radiusMeters, offerDeadlineSeconds, constraintCount, flexibility,
        weights: config.intentScoringWeights,
    });
    if (intentScore < config.gatingRules.minScoreToRouteToPartners) {
        return { success: false, message: `Intent score too low (${intentScore}). Adjust budget, radius, or time window.` };
    }
    const tier = getUserTier(context);
    const maxOpen = (_b = config.quotas[`maxOpenIntents${tier.charAt(0).toUpperCase() + tier.slice(1)}`]) !== null && _b !== void 0 ? _b : 2;
    const openSnap = await db.collection(INTENTS).where('createdByUid', '==', uid).where('status', '==', 'open').limit(maxOpen + 1).get();
    if (openSnap.size >= maxOpen)
        return { success: false, message: `Max ${maxOpen} open intents for your tier.` };
    const now = Date.now();
    const offerDeadlineAt = now + offerDeadlineSeconds * 1000;
    const fulfillmentDeadlineAt = now + fulfillmentDeadlineSeconds * 1000;
    const intentRef = db.collection(INTENTS).doc();
    const intent = {
        id: intentRef.id,
        createdAt: now,
        createdByUid: uid,
        cityId,
        geo: (d.geo && typeof d.geo.lat === 'number' && typeof d.geo.lng === 'number') ? d.geo : { lat: 0, lng: 0 },
        radiusMeters,
        category,
        templateVersion: 1,
        title,
        budget: { min: budgetMin, max: budgetMax, currency: 'USD' },
        offerDeadlineAt,
        fulfillmentDeadlineAt,
        flexibility,
        privacy,
        intentScore,
        status: 'open',
        lockedPartnerId: null,
        lockedOfferId: null,
        fulfillment: { pin: null, qrToken: null, verifiedAt: null, verifiedByPartnerId: null, verificationMethod: null },
        metrics: { offerCount: 0, shareCount: 0, viewCount: 0 },
        ruleRef: { ruleId: null },
        templateData,
        timeWindow: { startAt: now, endAt: fulfillmentDeadlineAt },
    };
    await intentRef.set(intent);
    await recordEvent('INTENT_CREATED', intentRef.id, uid, undefined, { intentScore });
    return { success: true, intentId: intentRef.id, intent: Object.assign({}, intent) };
});
/** Get single intent with offers. */
exports.intentGet = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'Deal Match is not enabled.' };
    const d = data;
    const id = typeof (d === null || d === void 0 ? void 0 : d.id) === 'string' ? d.id.trim() : '';
    if (!id)
        return { success: false, message: 'id required.' };
    const intentSnap = await db.collection(INTENTS).doc(id).get();
    if (!intentSnap.exists)
        return { success: false, message: 'Intent not found.' };
    const intent = Object.assign({ id: intentSnap.id }, intentSnap.data());
    const offersSnap = await db.collection(INTENTS).doc(id).collection(OFFERS).orderBy('createdAt', 'desc').limit(50).get();
    const offers = offersSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, intent, offers };
});
/** Feed: open intents (filter by cityId, category in-memory to limit indexes). */
exports.intentFeed = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, intents: [] };
    const d = data;
    const cityId = typeof (d === null || d === void 0 ? void 0 : d.cityId) === 'string' ? d.cityId : undefined;
    const category = typeof (d === null || d === void 0 ? void 0 : d.category) === 'string' ? d.category : undefined;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const snap = await db.collection(INTENTS).where('status', '==', 'open').orderBy('createdAt', 'desc').limit(200).get();
    const now = Date.now();
    let hasExpired = false;
    const batch = db.batch();
    const intents = [];
    snap.docs.forEach((doc) => {
        const b = doc.data();
        if (b.offerDeadlineAt <= now || b.fulfillmentDeadlineAt <= now) {
            batch.update(doc.ref, { status: 'expired' });
            hasExpired = true;
        }
        else {
            let include = true;
            if (cityId && b.cityId !== cityId)
                include = false;
            if (category && b.category !== category)
                include = false;
            if (include)
                intents.push(Object.assign({ id: doc.id }, b));
        }
    });
    if (hasExpired)
        await batch.commit();
    return { success: true, intents: intents.slice(0, limit) };
});
/** List intents created by current user. */
exports.intentListMine = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, intents: [] };
    const d = data;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const snap = await db.collection(INTENTS).where('createdByUid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get();
    const intents = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, intents };
});
/** Partner inbox: open intents eligible for partner (category, city, minBudget, minIntentScore). */
exports.intentListForPartner = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const { isPartner: isPartnerUser } = await isPartner(uid);
    if (!isPartnerUser)
        return { success: false, message: 'Partners only.' };
    const config = await getConfig();
    if (!config.enabled || config.emergencyKill.disableRouting)
        return { success: true, intents: [] };
    const settingsSnap = await db.collection(PARTNERS).doc(uid).collection(INTENT_SETTINGS).doc('default').get();
    const settings = settingsSnap.data();
    const categoriesEnabled = Array.isArray(settings === null || settings === void 0 ? void 0 : settings.categoriesEnabled) ? settings.categoriesEnabled : config.categoriesEnabled;
    const minBudget = typeof (settings === null || settings === void 0 ? void 0 : settings.minBudget) === 'number' ? settings.minBudget : 0;
    const minIntentScore = typeof (settings === null || settings === void 0 ? void 0 : settings.minIntentScore) === 'number' ? settings.minIntentScore : config.gatingRules.minScoreToRouteToPartners;
    const limit = Math.min(50, Math.max(1, Number(data === null || data === void 0 ? void 0 : data.limit) || 20));
    const snap = await db.collection(INTENTS).where('status', '==', 'open').orderBy('createdAt', 'desc').limit(150).get();
    const now = Date.now();
    const intents = [];
    snap.docs.forEach((doc) => {
        var _a, _b, _c;
        const b = doc.data();
        if (b.offerDeadlineAt <= now || b.fulfillmentDeadlineAt <= now)
            return;
        if (!categoriesEnabled.includes(b.category))
            return;
        if (((_b = (_a = b.budget) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : 0) < minBudget)
            return;
        if (((_c = b.intentScore) !== null && _c !== void 0 ? _c : 0) < minIntentScore)
            return;
        intents.push(Object.assign({ id: doc.id }, b));
    });
    return { success: true, intents: intents.slice(0, limit) };
});
/** Partner: submit offer. */
exports.intentOffer = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const { isPartner: isPartnerUser, partnerName } = await isPartner(uid);
    if (!isPartnerUser)
        return { success: false, message: 'Only partners can submit offers.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'Deal Match is not enabled.' };
    if (config.emergencyKill.disableOffers)
        return { success: false, message: 'Offers are temporarily disabled.' };
    const d = data;
    const intentId = typeof (d === null || d === void 0 ? void 0 : d.intentId) === 'string' ? d.intentId.trim() : '';
    if (!intentId)
        return { success: false, message: 'intentId required.' };
    const intentRef = db.collection(INTENTS).doc(intentId);
    const intentSnap = await intentRef.get();
    if (!intentSnap.exists)
        return { success: false, message: 'Intent not found.' };
    const intent = intentSnap.data();
    if (intent.status !== 'open')
        return { success: false, message: 'Intent is no longer open.' };
    const rateRef = db.collection(PARTNERS).doc(uid).collection(INTENT_OFFER_RATE).doc('hour');
    const rateSnap = await rateRef.get();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const timestamps = ((_a = rateSnap.data()) === null || _a === void 0 ? void 0 : _a.timestamps) || [];
    const recent = timestamps.filter((t) => t > oneHourAgo);
    const perHour = config.partnerLimits.offersPerHour;
    if (recent.length >= perHour)
        return { success: false, message: `Rate limit: max ${perHour} offers per hour.` };
    const existing = await intentRef.collection(OFFERS).where('partnerId', '==', uid).where('status', '==', 'active').limit(1).get();
    if (!existing.empty)
        return { success: false, message: 'You already have an active offer on this intent.' };
    const terms = d === null || d === void 0 ? void 0 : d.terms;
    const headline = typeof (terms === null || terms === void 0 ? void 0 : terms.headline) === 'string' ? terms.headline.trim() : 'My offer';
    const details = typeof (terms === null || terms === void 0 ? void 0 : terms.details) === 'string' ? terms.details.trim() : '';
    const price = typeof (terms === null || terms === void 0 ? void 0 : terms.price) === 'number' ? terms.price : null;
    const discountText = typeof (terms === null || terms === void 0 ? void 0 : terms.discountText) === 'string' ? terms.discountText.trim() : null;
    const valueScore = Math.max(0, Math.min(100, (_b = Number(terms === null || terms === void 0 ? void 0 : terms.valueScore)) !== null && _b !== void 0 ? _b : 50));
    const addons = Array.isArray(terms === null || terms === void 0 ? void 0 : terms.addons) ? terms.addons.slice(0, 5) : [];
    const expiresAt = Math.min(intent.offerDeadlineAt, Date.now() + 86400000);
    const offerRef = intentRef.collection(OFFERS).doc();
    const respondedInSeconds = Math.round((Date.now() - (intent.createdAt || 0)) / 1000);
    const trustScore = await getPartnerTrustScore(uid);
    const rankScore = valueScore * config.rankingWeights.value + trustScore * config.rankingWeights.trust - (respondedInSeconds / 60) * config.rankingWeights.speed;
    const offer = {
        id: offerRef.id,
        createdAt: Date.now(),
        partnerId: uid,
        partnerName: partnerName || uid,
        terms: { headline, details, price, discountText, valueScore, addons },
        expiresAt,
        status: 'active',
        rankScore,
        sla: { respondedInSeconds },
    };
    await offerRef.set(offer);
    await intentRef.update({ 'metrics.offerCount': FieldValue.increment(1) });
    await rateRef.set({ timestamps: [...recent, Date.now()].slice(-perHour * 2) }, { merge: true });
    return { success: true, offerId: offerRef.id, offer: Object.assign({}, offer) };
});
/** Creator: accept one offer (transaction). */
exports.intentAcceptOffer = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const intentId = typeof (d === null || d === void 0 ? void 0 : d.intentId) === 'string' ? d.intentId.trim() : '';
    const offerId = typeof (d === null || d === void 0 ? void 0 : d.offerId) === 'string' ? d.offerId.trim() : '';
    if (!intentId || !offerId)
        return { success: false, message: 'intentId and offerId required.' };
    const intentRef = db.collection(INTENTS).doc(intentId);
    const offerRef = intentRef.collection(OFFERS).doc(offerId);
    return db.runTransaction(async (tx) => {
        const intentSnap = await tx.get(intentRef);
        if (!intentSnap.exists)
            return { success: false, message: 'Intent not found.' };
        const intent = intentSnap.data();
        if (intent.createdByUid !== uid)
            return { success: false, message: 'Only the intent creator can accept an offer.' };
        if (intent.status !== 'open')
            return { success: false, message: 'Intent is no longer open.' };
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists)
            return { success: false, message: 'Offer not found.' };
        const offer = offerSnap.data();
        if (offer.status !== 'active')
            return { success: false, message: 'Offer is no longer active.' };
        const pin = String(Math.floor(100000 + Math.random() * 900000));
        const qrToken = `intent_${intentId}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
        tx.update(intentRef, {
            status: 'locked',
            lockedPartnerId: offer.partnerId,
            lockedOfferId: offerId,
            'fulfillment.pin': pin,
            'fulfillment.qrToken': qrToken,
        });
        tx.update(offerRef, { status: 'accepted' });
        const others = await tx.get(intentRef.collection(OFFERS).where('status', '==', 'active'));
        others.docs.forEach((doc) => { if (doc.id !== offerId)
            tx.update(doc.ref, { status: 'closed' }); });
        return { success: true, pin, qrToken, intentId, offerId, lockedPartnerId: offer.partnerId };
    }).then(async (res) => {
        if (res.success && res.lockedPartnerId)
            await recordEvent('OFFER_ACCEPTED', intentId, uid, res.lockedPartnerId, { offerId });
        return res;
    });
});
/** Partner: verify fulfillment (transaction); create Deal Done Card. */
exports.intentVerifyFulfillment = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const intentId = typeof (d === null || d === void 0 ? void 0 : d.intentId) === 'string' ? d.intentId.trim() : '';
    const pinOrToken = typeof (d === null || d === void 0 ? void 0 : d.pin) === 'string' ? d.pin.trim() : (typeof (d === null || d === void 0 ? void 0 : d.qrToken) === 'string' ? d.qrToken.trim() : '');
    if (!intentId || !pinOrToken)
        return { success: false, message: 'intentId and pin or qrToken required.' };
    const intentRef = db.collection(INTENTS).doc(intentId);
    return db.runTransaction(async (tx) => {
        var _a, _b;
        const intentSnap = await tx.get(intentRef);
        if (!intentSnap.exists)
            return { success: false, message: 'Intent not found.' };
        const intent = intentSnap.data();
        if (intent.status !== 'locked')
            return { success: false, message: 'Intent is not locked.' };
        if (intent.lockedPartnerId !== uid)
            return { success: false, message: 'Only the accepted partner can verify.' };
        const f = intent.fulfillment || {};
        if (f.pin !== pinOrToken && f.qrToken !== pinOrToken)
            return { success: false, message: 'Invalid PIN or QR code.' };
        const now = Date.now();
        const verificationMethod = f.pin === pinOrToken ? 'pin' : 'qr';
        tx.update(intentRef, {
            status: 'fulfilled',
            'fulfillment.verifiedAt': now,
            'fulfillment.verifiedByPartnerId': uid,
            'fulfillment.verificationMethod': verificationMethod,
        });
        const offerSnap = await tx.get(intentRef.collection(OFFERS).doc(intent.lockedOfferId));
        const offer = offerSnap.exists ? offerSnap.data() : {};
        const timeToWinSeconds = Math.round((now - (intent.createdAt || 0)) / 1000);
        const savingsText = ((_a = offer.terms) === null || _a === void 0 ? void 0 : _a.discountText) || (((_b = offer.terms) === null || _b === void 0 ? void 0 : _b.price) != null ? `$${offer.terms.price}` : 'Deal done');
        const cardRef = db.collection(DEAL_DONE_CARDS).doc();
        const payload = { intentId, partnerId: uid, userUid: intent.createdByUid, verifiedAt: now };
        const card = {
            id: cardRef.id,
            createdAt: now,
            intentId,
            partnerId: uid,
            userUid: intent.createdByUid,
            summary: {
                title: intent.title,
                savingsText,
                timeToWinSeconds,
                verifiedAt: now,
            },
            proof: { signature: `orbintent_${cardRef.id}_${now}`, payload },
            share: { deepLinkPath: `/deal/${cardRef.id}` },
        };
        tx.set(cardRef, card);
        tx.update(intentRef, { dealCardId: cardRef.id });
        return { success: true, fulfilledAt: now, cardId: cardRef.id, card };
    }).then(async (res) => {
        if (res.success)
            await recordEvent('FULFILLMENT_VERIFIED', intentId, uid, uid, { cardId: res.cardId });
        return res;
    });
});
/** Create rule. */
exports.ruleCreate = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'Deal Match is not enabled.' };
    const tier = getUserTier(context);
    const maxRules = (_a = config.ruleEngine[`maxRulesPerUser${tier.charAt(0).toUpperCase() + tier.slice(1)}`]) !== null && _a !== void 0 ? _a : 0;
    const existing = await db.collection(RULES).where('createdByUid', '==', uid).limit(maxRules + 1).get();
    if (existing.size >= maxRules)
        return { success: false, message: `Max ${maxRules} rules for your tier.` };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    const name = typeof d.name === 'string' ? d.name.trim() : 'My rule';
    const category = (['food', 'retail', 'services', 'nightlife', 'appointment'].includes(String(d.category)) ? d.category : 'food');
    const cityId = typeof d.cityId === 'string' ? d.cityId.trim() : 'default';
    const schedule = (d.schedule && typeof d.schedule === 'object') ? d.schedule : { type: 'daypart', timezone: 'America/New_York', daysOfWeek: [1, 2, 3, 4, 5], startHour: 8, endHour: 10 };
    const constraints = (d.constraints && typeof d.constraints === 'object') ? d.constraints : {};
    const cooldownMinutes = Math.max(0, Math.min(10080, (_b = Number(d.cooldownMinutes)) !== null && _b !== void 0 ? _b : 60));
    const autoAccept = (d.autoAccept && typeof d.autoAccept === 'object') ? d.autoAccept : { enabled: false, graceSeconds: 300, requiresTrusted: true };
    const templateData = (d.templateData && typeof d.templateData === 'object') ? d.templateData : {};
    const ruleRef = db.collection(RULES).doc();
    const rule = {
        id: ruleRef.id,
        createdAt: Date.now(),
        createdByUid: uid,
        cityId,
        enabled: true,
        name,
        category,
        schedule: { type: schedule.type || 'daypart', timezone: schedule.timezone || 'America/New_York', daysOfWeek: (_c = schedule.daysOfWeek) !== null && _c !== void 0 ? _c : [1, 2, 3, 4, 5], startHour: (_d = schedule.startHour) !== null && _d !== void 0 ? _d : 8, endHour: (_e = schedule.endHour) !== null && _e !== void 0 ? _e : 10 },
        constraints: {
            radiusMeters: Number(constraints.radiusMeters) || 5000,
            budgetMax: Number(constraints.budgetMax) || 100,
            budgetMin: Number(constraints.budgetMin) || 0,
            minValueScore: Number(constraints.minValueScore) || 0,
            trustedOnly: Boolean(constraints.trustedOnly),
            minPartnerTrustScore: typeof constraints.minPartnerTrustScore === 'number' ? constraints.minPartnerTrustScore : null,
        },
        cooldownMinutes,
        autoAccept: { enabled: Boolean(autoAccept.enabled), graceSeconds: Number(autoAccept.graceSeconds) || 300, requiresTrusted: Boolean(autoAccept.requiresTrusted) },
        templateData,
    };
    await ruleRef.set(rule);
    return { success: true, ruleId: ruleRef.id, rule: Object.assign({}, rule) };
});
/** Update rule. */
exports.ruleUpdate = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const ruleId = typeof (d === null || d === void 0 ? void 0 : d.ruleId) === 'string' ? d.ruleId.trim() : '';
    if (!ruleId)
        return { success: false, message: 'ruleId required.' };
    const ruleRef = db.collection(RULES).doc(ruleId);
    const snap = await ruleRef.get();
    if (!snap.exists)
        return { success: false, message: 'Rule not found.' };
    if (snap.data().createdByUid !== uid)
        return { success: false, message: 'Not your rule.' };
    const updates = {};
    if (typeof (d === null || d === void 0 ? void 0 : d.enabled) === 'boolean')
        updates.enabled = d.enabled;
    if (typeof (d === null || d === void 0 ? void 0 : d.name) === 'string')
        updates.name = d.name.trim();
    if ((d === null || d === void 0 ? void 0 : d.schedule) && typeof d.schedule === 'object')
        updates.schedule = d.schedule;
    if ((d === null || d === void 0 ? void 0 : d.constraints) && typeof d.constraints === 'object')
        updates.constraints = d.constraints;
    if (typeof (d === null || d === void 0 ? void 0 : d.cooldownMinutes) === 'number')
        updates.cooldownMinutes = d.cooldownMinutes;
    if ((d === null || d === void 0 ? void 0 : d.autoAccept) && typeof d.autoAccept === 'object')
        updates.autoAccept = d.autoAccept;
    if (Object.keys(updates).length === 0)
        return { success: true, ruleId };
    await ruleRef.update(updates);
    return { success: true, ruleId };
});
/** List rules for current user. */
exports.ruleList = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, rules: [] };
    const d = data;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const snap = await db.collection(RULES).where('createdByUid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get();
    const rules = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, rules };
});
/** Run rule now (dev/admin only). */
exports.ruleRunNow = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin or dev only.' };
    const d = data;
    const ruleId = typeof (d === null || d === void 0 ? void 0 : d.ruleId) === 'string' ? d.ruleId.trim() : '';
    if (!ruleId)
        return { success: false, message: 'ruleId required.' };
    const ruleSnap = await db.collection(RULES).doc(ruleId).get();
    if (!ruleSnap.exists)
        return { success: false, message: 'Rule not found.' };
    const rule = ruleSnap.data();
    if (!rule.enabled)
        return { success: false, message: 'Rule is disabled.' };
    // Stub: in production would create intent from rule and dispatch; for now return ok
    await recordEvent('RULE_RUN_NOW', '', rule.createdByUid, undefined, { ruleId });
    return { success: true, message: 'Rule run triggered (stub).' };
});
/** Get Deal Done Card. */
exports.dealDoneGet = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const d = data;
    const cardId = typeof (d === null || d === void 0 ? void 0 : d.cardId) === 'string' ? d.cardId.trim() : '';
    if (!cardId)
        return { success: false, message: 'cardId required.' };
    const snap = await db.collection(DEAL_DONE_CARDS).doc(cardId).get();
    if (!snap.exists)
        return { success: false, message: 'Card not found.' };
    const card = Object.assign({ id: snap.id }, snap.data());
    return { success: true, card };
});
/** Admin: metrics. */
exports.adminOrbIntentMetrics = functions
    .region('us-central1')
    .https.onCall(async (_data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const config = await getConfig();
    const intentsSnap = await db.collection(INTENTS).limit(500).get();
    let open = 0, locked = 0, fulfilled = 0, expired = 0, cancelled = 0;
    intentsSnap.docs.forEach((doc) => {
        const s = doc.data().status;
        if (s === 'open')
            open++;
        else if (s === 'locked')
            locked++;
        else if (s === 'fulfilled')
            fulfilled++;
        else if (s === 'expired')
            expired++;
        else if (s === 'cancelled')
            cancelled++;
    });
    const cardsSnap = await db.collection(DEAL_DONE_CARDS).limit(1).get();
    return {
        success: true,
        metrics: {
            configEnabled: config.enabled,
            emergencyKill: config.emergencyKill,
            intents: { open, locked, fulfilled, expired, cancelled, total: intentsSnap.size },
            dealDoneCardsCount: cardsSnap.size,
        },
    };
});
/** Admin: update config. */
exports.adminOrbIntentUpdateConfig = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    const ref = db.collection(ORBTAP_CONFIG).doc(ORB_INTENT_DOC);
    await ref.set(d, { merge: true });
    return { success: true };
});
//# sourceMappingURL=orbIntent.js.map