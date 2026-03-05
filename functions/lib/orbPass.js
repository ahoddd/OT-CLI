"use strict";
/**
 * OrbPass™ — Cloud Functions: config, eligible offers, redemption flow, admin.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrbPassEmergencyKill = exports.adminOrbPassSettlementRunMonth = exports.adminOrbPassUpdateConfig = exports.adminOrbPassMetrics = exports.orbPassPartnerUpdateSettings = exports.orbPassPartnerInbox = exports.orbPassRedemptionHistory = exports.orbPassRedemptionComplete = exports.orbPassRedemptionVerify = exports.orbPassRedemptionInitiate = exports.orbPassEligibleOffers = exports.orbPassGetConfig = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const ORBTAP_CONFIG = 'orbtapConfig';
const ORB_PASS_DOC = 'orbPass';
const PARTNERS = 'partners';
const ORB_PASS_SETTINGS = 'orbPassSettings';
const REDEMPTIONS = 'orbPassRedemptions';
const LEDGER = 'orbPassPartnerLedger';
const EVENTS = 'orbPassEvents';
const VELOCITY = 'orbPassVelocity';
const USER_MONTH = 'orbPassUserMonth';
const DEFAULT_CONFIG = {
    enabled: false,
    citiesEnabled: [],
    tiersEnabled: { free: false, premium: true, pro: true },
    capsByTier: {
        free: { redemptionsPerMonth: 0, maxValuePerMonth: 0, cooldownHours: 24 },
        premium: { redemptionsPerMonth: 5, maxValuePerMonth: 5000, cooldownHours: 12 },
        pro: { redemptionsPerMonth: 15, maxValuePerMonth: 15000, cooldownHours: 6 },
    },
    categoryCapsByTier: { premium: { food: 3, retail: 3, services: 2, nightlife: 2, appointment: 2 }, pro: { food: 8, retail: 8, services: 5, nightlife: 5, appointment: 5 } },
    partnerRules: { maxValuePerRedemption: 2000, minPartnerTrustScore: 50, requireVerification: true, disputeWindowHours: 72 },
    antiFraud: { maxRedemptionsPerDay: 5, velocityWindowMinutes: 15, velocityMaxActions: 3, deviceBindingRequired: false },
    settlement: { payoutMode: 'perRedemption', monthlyPoolAmount: 0, payoutWeights: { volume: 0.5, quality: 0.3, incremental: 0.2 }, holdbackPercent: 5 },
    emergencyKill: { disableDiscovery: false, disableRedemption: false, disableSettlement: false },
};
async function getConfig() {
    const snap = await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).get();
    if (!snap.exists)
        return DEFAULT_CONFIG;
    const d = snap.data();
    return {
        enabled: (d === null || d === void 0 ? void 0 : d.enabled) === true,
        citiesEnabled: Array.isArray(d === null || d === void 0 ? void 0 : d.citiesEnabled) ? d.citiesEnabled : DEFAULT_CONFIG.citiesEnabled,
        tiersEnabled: Object.assign(Object.assign({}, DEFAULT_CONFIG.tiersEnabled), d === null || d === void 0 ? void 0 : d.tiersEnabled),
        capsByTier: Object.assign(Object.assign({}, DEFAULT_CONFIG.capsByTier), d === null || d === void 0 ? void 0 : d.capsByTier),
        categoryCapsByTier: Object.assign(Object.assign({}, DEFAULT_CONFIG.categoryCapsByTier), d === null || d === void 0 ? void 0 : d.categoryCapsByTier),
        partnerRules: Object.assign(Object.assign({}, DEFAULT_CONFIG.partnerRules), d === null || d === void 0 ? void 0 : d.partnerRules),
        antiFraud: Object.assign(Object.assign({}, DEFAULT_CONFIG.antiFraud), d === null || d === void 0 ? void 0 : d.antiFraud),
        settlement: Object.assign(Object.assign({}, DEFAULT_CONFIG.settlement), d === null || d === void 0 ? void 0 : d.settlement),
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
    return snap.exists;
}
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminContext(context) {
    var _a, _b, _c;
    if (!context.auth)
        return false;
    const email = ((_c = (_b = (_a = context.auth.token) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b)) || '';
    return ADMIN_EMAILS.includes(email);
}
async function recordEvent(type, metadata) {
    var _a, _b, _c;
    await db.collection(EVENTS).add({
        ts: FieldValue.serverTimestamp(),
        type,
        userUid: (_a = metadata.userUid) !== null && _a !== void 0 ? _a : null,
        partnerId: (_b = metadata.partnerId) !== null && _b !== void 0 ? _b : null,
        redemptionId: (_c = metadata.redemptionId) !== null && _c !== void 0 ? _c : null,
        metadata,
    });
}
function monthKey(ts) {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
/** Get config + eligibility for current user. */
exports.orbPassGetConfig = functions
    .region('us-central1')
    .https.onCall(async (_data, context) => {
    var _a;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    const tier = getUserTier(context);
    const tierEnabled = config.tiersEnabled[tier] === true;
    const eligible = config.enabled && tierEnabled && !config.emergencyKill.disableDiscovery;
    const caps = (_a = config.capsByTier[tier]) !== null && _a !== void 0 ? _a : config.capsByTier.free;
    return {
        success: true,
        config: { enabled: config.enabled, emergencyKill: config.emergencyKill, capsByTier: config.capsByTier },
        userTier: tier,
        eligible,
        caps: eligible ? caps : null,
    };
});
/** List eligible offers (partners with orbPass enabled, filtered by city/tier). */
exports.orbPassEligibleOffers = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b, _c;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled || config.emergencyKill.disableDiscovery)
        return { success: true, offers: [] };
    const tier = getUserTier(context);
    if (!config.tiersEnabled[tier])
        return { success: true, offers: [] };
    const d = data;
    const cityId = typeof (d === null || d === void 0 ? void 0 : d.cityId) === 'string' ? d.cityId.trim() : 'default';
    if (config.citiesEnabled && config.citiesEnabled.length > 0 && !config.citiesEnabled.includes(cityId))
        return { success: true, offers: [] };
    const partnersSnap = await db.collection(PARTNERS).limit(100).get();
    const offers = [];
    for (const doc of partnersSnap.docs) {
        const partnerId = doc.id;
        const setSnap = await db.collection(PARTNERS).doc(partnerId).collection(ORB_PASS_SETTINGS).doc('default').get();
        if (!setSnap.exists)
            continue;
        const s = setSnap.data();
        if (s.enabled !== true)
            continue;
        const cities = (_a = s.citiesEnabled) !== null && _a !== void 0 ? _a : [];
        if (cities.length > 0 && !cities.includes(cityId))
            continue;
        const templates = Array.isArray(s.offerTemplates) ? s.offerTemplates : [];
        const partnerName = (_c = (_b = doc.data()) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : partnerId;
        templates.forEach((t, i) => {
            var _a, _b, _c, _d, _e, _f, _g;
            offers.push({
                offerId: `${partnerId}_${i}`,
                partnerId,
                partnerName,
                title: (_a = t.title) !== null && _a !== void 0 ? _a : 'OrbPass offer',
                description: (_b = t.description) !== null && _b !== void 0 ? _b : '',
                valueCents: typeof t.valueCents === 'number' ? t.valueCents : 0,
                redemptionRules: (_c = t.redemptionRules) !== null && _c !== void 0 ? _c : '',
                cooldownHours: (_e = (_d = s.redemptionConstraints) === null || _d === void 0 ? void 0 : _d.cooldownHours) !== null && _e !== void 0 ? _e : 24,
                minSpendCents: (_g = (_f = s.redemptionConstraints) === null || _f === void 0 ? void 0 : _f.minSpendCents) !== null && _g !== void 0 ? _g : null,
            });
        });
    }
    return { success: true, offers };
});
/** Initiate redemption: create redemption doc, issue PIN/QR. */
exports.orbPassRedemptionInitiate = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: false, message: 'OrbPass is not enabled.' };
    if (config.emergencyKill.disableRedemption)
        return { success: false, message: 'Redemption is temporarily disabled.' };
    const d = data;
    const partnerId = typeof (d === null || d === void 0 ? void 0 : d.partnerId) === 'string' ? d.partnerId.trim() : '';
    const offerTemplateId = typeof (d === null || d === void 0 ? void 0 : d.offerTemplateId) === 'string' ? d.offerTemplateId : null;
    const valueCents = Math.max(0, Math.min(config.partnerRules.maxValuePerRedemption, Number(d === null || d === void 0 ? void 0 : d.valueCents) || 0));
    const cityId = typeof (d === null || d === void 0 ? void 0 : d.cityId) === 'string' ? d.cityId.trim() : 'default';
    if (!partnerId || valueCents <= 0)
        return { success: false, message: 'partnerId and valueCents required.' };
    const tier = getUserTier(context);
    if (!config.tiersEnabled[tier])
        return { success: false, message: 'OrbPass not available for your tier.' };
    const caps = (_a = config.capsByTier[tier]) !== null && _a !== void 0 ? _a : config.capsByTier.free;
    const now = Date.now();
    const key = monthKey(now);
    const userMonthRef = db.collection(USER_MONTH).doc(`${uid}_${key}`);
    const userMonthSnap = await userMonthRef.get();
    const userMonth = userMonthSnap.data() || { redemptions: 0, valueCents: 0 };
    if (userMonth.redemptions >= caps.redemptionsPerMonth)
        return { success: false, message: 'Monthly redemption cap reached.' };
    if (userMonth.valueCents + valueCents > caps.maxValuePerMonth)
        return { success: false, message: 'Monthly value cap would be exceeded.' };
    const velocityRef = db.collection(VELOCITY).doc(uid);
    const velSnap = await velocityRef.get();
    const windowMs = config.antiFraud.velocityWindowMinutes * 60 * 1000;
    const since = now - windowMs;
    const timestamps = ((_b = velSnap.data()) === null || _b === void 0 ? void 0 : _b.timestamps) || [];
    const recent = timestamps.filter((t) => t > since);
    if (recent.length >= config.antiFraud.velocityMaxActions)
        return { success: false, message: 'Too many actions; try again later.' };
    const partnerSettingsSnap = await db.collection(PARTNERS).doc(partnerId).collection(ORB_PASS_SETTINGS).doc('default').get();
    if (!partnerSettingsSnap.exists)
        return { success: false, message: 'Partner not found.' };
    const partnerSettings = partnerSettingsSnap.data();
    if (partnerSettings.enabled !== true)
        return { success: false, message: 'Partner OrbPass is not enabled.' };
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const qrToken = `orbpass_${uid}_${now}_${Math.random().toString(36).slice(2, 10)}`;
    const redemptionRef = db.collection(REDEMPTIONS).doc();
    const redemption = {
        id: redemptionRef.id,
        createdAt: now,
        cityId,
        userUid: uid,
        userTier: tier,
        partnerId,
        offerTemplateId,
        valueCents,
        status: 'initiated',
        verification: { method: null, pin, qrToken, verifiedAt: null, verifiedByPartnerId: null },
        countersSnapshot: { userMonthRedemptions: userMonth.redemptions + 1, userMonthValueCents: userMonth.valueCents + valueCents },
        audit: { riskScore: 0, notes: null },
    };
    await redemptionRef.set(redemption);
    await userMonthRef.set({
        redemptions: redemption.countersSnapshot.userMonthRedemptions,
        valueCents: redemption.countersSnapshot.userMonthValueCents,
    }, { merge: true });
    await velocityRef.set({ timestamps: [...recent, now].slice(-config.antiFraud.velocityMaxActions * 2) }, { merge: true });
    await recordEvent('REDEMPTION_INITIATED', { userUid: uid, partnerId, redemptionId: redemptionRef.id });
    return { success: true, redemptionId: redemptionRef.id, pin, qrToken, redemption: Object.assign({}, redemption) };
});
/** Partner: verify PIN/QR (transaction). */
exports.orbPassRedemptionVerify = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const isPartnerUser = await isPartner(uid);
    if (!isPartnerUser)
        return { success: false, message: 'Only the partner can verify.' };
    const d = data;
    const redemptionId = typeof (d === null || d === void 0 ? void 0 : d.redemptionId) === 'string' ? d.redemptionId.trim() : '';
    const pinOrToken = typeof (d === null || d === void 0 ? void 0 : d.pin) === 'string' ? d.pin.trim() : (typeof (d === null || d === void 0 ? void 0 : d.qrToken) === 'string' ? d.qrToken.trim() : '');
    if (!redemptionId || !pinOrToken)
        return { success: false, message: 'redemptionId and pin or qrToken required.' };
    const ref = db.collection(REDEMPTIONS).doc(redemptionId);
    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists)
            return { success: false, message: 'Redemption not found.' };
        const r = snap.data();
        if (r.partnerId !== uid)
            return { success: false, message: 'Not your redemption.' };
        if (r.status !== 'initiated')
            return { success: false, message: 'Already verified or completed.' };
        const v = r.verification || {};
        if (v.pin !== pinOrToken && v.qrToken !== pinOrToken)
            return { success: false, message: 'Invalid PIN or QR code.' };
        const now = Date.now();
        tx.update(ref, {
            status: 'verified',
            'verification.verifiedAt': now,
            'verification.verifiedByPartnerId': uid,
            'verification.method': v.pin === pinOrToken ? 'pin' : 'qr',
        });
        return { success: true, verifiedAt: now };
    });
});
/** Complete redemption (user or system): mark completed, write ledger entry. */
exports.orbPassRedemptionComplete = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const redemptionId = typeof (d === null || d === void 0 ? void 0 : d.redemptionId) === 'string' ? d.redemptionId.trim() : '';
    if (!redemptionId)
        return { success: false, message: 'redemptionId required.' };
    const config = await getConfig();
    const ref = db.collection(REDEMPTIONS).doc(redemptionId);
    return db.runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(ref);
        if (!snap.exists)
            return { success: false, message: 'Redemption not found.' };
        const r = snap.data();
        if (r.userUid !== uid)
            return { success: false, message: 'Not your redemption.' };
        if (r.status !== 'verified')
            return { success: false, message: 'Redemption must be verified first.' };
        const now = Date.now();
        tx.update(ref, { status: 'completed' });
        const amountCents = Math.round(((_a = r.valueCents) !== null && _a !== void 0 ? _a : 0) * (1 - ((_b = config.settlement.holdbackPercent) !== null && _b !== void 0 ? _b : 0) / 100));
        const ledgerRef = db.collection(LEDGER).doc();
        const key = monthKey(now);
        tx.set(ledgerRef, {
            id: ledgerRef.id,
            createdAt: now,
            partnerId: r.partnerId,
            redemptionId,
            amountCents,
            status: 'pending',
            monthKey: key,
            reason: 'redemption_completed',
        });
        await recordEvent('REDEMPTION_COMPLETED', { userUid: uid, partnerId: r.partnerId, redemptionId });
        return { success: true, completedAt: now };
    });
});
/** User redemption history. */
exports.orbPassRedemptionHistory = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, redemptions: [] };
    const d = data;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    const snap = await db.collection(REDEMPTIONS).where('userUid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get();
    const redemptions = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, redemptions };
});
/** Partner inbox: pending/locked/verified redemptions. */
exports.orbPassPartnerInbox = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    if (!(await isPartner(uid)))
        return { success: false, message: 'Partners only.' };
    const config = await getConfig();
    if (!config.enabled)
        return { success: true, redemptions: [] };
    const d = data;
    const status = typeof (d === null || d === void 0 ? void 0 : d.status) === 'string' ? d.status : undefined;
    const limit = Math.min(50, Math.max(1, Number(d === null || d === void 0 ? void 0 : d.limit) || 20));
    let q = db.collection(REDEMPTIONS).where('partnerId', '==', uid).orderBy('createdAt', 'desc').limit(limit);
    if (status)
        q = q.where('status', '==', status);
    const snap = await q.get();
    const redemptions = snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { success: true, redemptions };
});
/** Partner update OrbPass settings. */
exports.orbPassPartnerUpdateSettings = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    if (!(await isPartner(uid)))
        return { success: false, message: 'Partners only.' };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    const ref = db.collection(PARTNERS).doc(uid).collection(ORB_PASS_SETTINGS).doc('default');
    await ref.set(d, { merge: true });
    return { success: true };
});
/** Admin: metrics. */
exports.adminOrbPassMetrics = functions
    .region('us-central1')
    .https.onCall(async (_data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const config = await getConfig();
    const redSnap = await db.collection(REDEMPTIONS).limit(500).get();
    let initiated = 0, verified = 0, completed = 0, cancelled = 0;
    redSnap.docs.forEach((doc) => {
        const s = doc.data().status;
        if (s === 'initiated')
            initiated++;
        else if (s === 'verified')
            verified++;
        else if (s === 'completed')
            completed++;
        else if (s === 'cancelled')
            cancelled++;
    });
    return {
        success: true,
        configEnabled: config.enabled,
        emergencyKill: config.emergencyKill,
        redemptions: { initiated, verified, completed, cancelled, total: redSnap.size },
    };
});
/** Admin: update config. */
exports.adminOrbPassUpdateConfig = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const d = data;
    if (!d || typeof d !== 'object')
        return { success: false, message: 'Payload required.' };
    await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).set(d, { merge: true });
    return { success: true };
});
/** Admin: run settlement for month (idempotent: only creates ledger entries for completed redemptions that don't have one yet). */
exports.adminOrbPassSettlementRunMonth = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const config = await getConfig();
    if (config.emergencyKill.disableSettlement)
        return { success: false, message: 'Settlement is disabled.' };
    const d = data;
    const monthKeyParam = typeof (d === null || d === void 0 ? void 0 : d.monthKey) === 'string' ? d.monthKey.trim() : monthKey(Date.now());
    const completedSnap = await db.collection(REDEMPTIONS).where('status', '==', 'completed').get();
    const existingLedgerSnap = await db.collection(LEDGER).where('monthKey', '==', monthKeyParam).limit(500).get();
    const existingRedemptionIds = new Set(existingLedgerSnap.docs.map((doc) => doc.data().redemptionId).filter(Boolean));
    const batch = db.batch();
    let added = 0;
    completedSnap.docs.forEach((doc) => {
        var _a, _b, _c;
        const r = doc.data();
        const createdAt = (_a = r.createdAt) !== null && _a !== void 0 ? _a : 0;
        if (monthKey(createdAt) !== monthKeyParam)
            return;
        if (existingRedemptionIds.has(doc.id))
            return;
        const pid = r.partnerId;
        if (!pid)
            return;
        const amountCents = Math.round(((_b = r.valueCents) !== null && _b !== void 0 ? _b : 0) * (1 - ((_c = config.settlement.holdbackPercent) !== null && _c !== void 0 ? _c : 0) / 100));
        const ledgerRef = db.collection(LEDGER).doc();
        batch.set(ledgerRef, {
            id: ledgerRef.id,
            createdAt: Date.now(),
            partnerId: pid,
            redemptionId: doc.id,
            amountCents,
            status: 'pending',
            monthKey: monthKeyParam,
            reason: 'settlement_run',
        });
        added++;
    });
    await batch.commit();
    return { success: true, message: `Settlement: ${added} ledger entries created for ${monthKeyParam}.` };
});
/** Admin: emergency kill flags. */
exports.adminOrbPassEmergencyKill = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context))
        return { success: false, message: 'Admin only.' };
    const d = data;
    const kill = d === null || d === void 0 ? void 0 : d.emergencyKill;
    if (!kill || typeof kill !== 'object')
        return { success: false, message: 'emergencyKill object required.' };
    await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).set({ emergencyKill: kill }, { merge: true });
    return { success: true };
});
//# sourceMappingURL=orbPass.js.map