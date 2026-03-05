"use strict";
/**
 * OrbPilot™ — Outcome-First Verified-Visit Autopilot Cloud Functions.
 * Closed-loop: partners set budgets/schedules → engine releases slots →
 * users claim → scan → verify → OT Points granted idempotently.
 *
 * All Firestore writes are backend-only. Clients use callables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orbPilotUserHistory = exports.orbPilotPartnerActivity = exports.orbPilotPartnerListCampaigns = exports.orbPilotAdminEngineLastRun = exports.orbPilotAdminUpdateConfig = exports.orbPilotAdminGetConfig = exports.orbPilotAdminListTrust = exports.orbPilotAdminListCampaigns = exports.orbPilotAdminPartnerRisk = exports.orbPilotAdminUserTrust = exports.orbPilotAdminAudit = exports.orbPilotAdminKillSwitch = exports.orbPilotMetricsCampaign = exports.orbPilotMetricsPartner = exports.orbPilotPinRotate = exports.orbPilotPinCurrent = exports.orbPilotVerifyComplete = exports.orbPilotVerifyInitiate = exports.orbPilotOfferCancel = exports.orbPilotOfferClaim = exports.orbPilotOfferNearby = exports.orbPilotEngineTick = exports.orbPilotCampaignEnd = exports.orbPilotCampaignResume = exports.orbPilotCampaignPause = exports.orbPilotCampaignActivate = exports.orbPilotCampaignUpdate = exports.orbPilotCampaignGet = exports.orbPilotCampaignCreate = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
// ─── Collection names ─────────────────────────────────────────────────────────
const C_CAMPAIGNS = 'orbPilotCampaigns';
const C_WINDOWS = 'orbPilotWindows';
const C_SLOTS = 'orbPilotSlots';
const C_VISITS = 'orbPilotVisits';
const C_TRUST = 'orbPilotUserTrust';
const C_PINS = 'orbPilotPartnerPins';
const C_ATTEMPTS = 'orbPilotAttempts';
const C_ENGINE_RUNS = 'orbPilotEngineRuns';
const C_AUDIT = 'orbPilotAuditLogs';
const C_KILL_SWITCHES = 'orbPilotKillSwitches';
const C_CONFIG = 'orbtapConfig';
const CONFIG_DOC = 'orbPilot';
const C_LEDGERS = 'ledgers';
const C_LEDGER_ENTRIES = 'entries';
const C_EARN_IDEMPOTENCY = 'earnIdempotency';
const C_PARTNERS = 'partners';
// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
    pinLength: 6,
    pinRotationSeconds: 45,
    maxPinAttempts: 5,
    pinAttemptWindowSeconds: 600,
    claimRadiusMeters: 500,
    verifyRadiusMeters: 150,
    maxAccuracyMeters: 50,
    completeWithinSeconds: 300,
    cpaMaxUsd: 5.0,
    otPointCostUsd: 0.01,
    boostFillRateThreshold: 0.5,
    rescueFillRateThreshold: 0.25,
    maxVVPerUserPerWeek: 3,
    slotUnclaimedExpirySeconds: 900,
    claimExpirySeconds: 1800,
    offerSearchRadiusM: 5000,
    maxOffersNearby: 20,
    defaultBasePoints: 50,
    defaultBoostPoints: 75,
    defaultRescuePoints: 100,
};
// ─── Auth helpers ─────────────────────────────────────────────────────────────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminCtx(context) {
    var _a, _b, _c;
    if (!context.auth)
        return false;
    const email = ((_c = (_b = (_a = context.auth.token) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b)) || '';
    return ADMIN_EMAILS.includes(email);
}
function requireAuth(context) {
    var _a;
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new functions.https.HttpsError('unauthenticated', 'Not signed in');
    return context.auth.uid;
}
function requireAdmin(context) {
    const uid = requireAuth(context);
    if (!isAdminCtx(context))
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    return uid;
}
// ─── Secret / HMAC ────────────────────────────────────────────────────────────
function getQrSecret() {
    var _a, _b;
    try {
        const raw = process.env['ORPTAPSECRET'];
        if (raw) {
            const parsed = JSON.parse(raw);
            return ((_a = parsed === null || parsed === void 0 ? void 0 : parsed.env) === null || _a === void 0 ? void 0 : _a.qr_secret) || ((_b = parsed === null || parsed === void 0 ? void 0 : parsed.env) === null || _b === void 0 ? void 0 : _b.encryption_key) || '';
        }
    }
    catch ( /* ignore */_c) { /* ignore */ }
    return process.env['QR_SECRET'] || 'dev_secret_change_me';
}
function signQrPayload(payload) {
    return crypto.createHmac('sha256', getQrSecret()).update(payload).digest('hex').slice(0, 16);
}
function verifyQrSignature(partnerId, windowId, sig) {
    const expected = signQrPayload(`${partnerId}:${windowId}`);
    return crypto.timingSafeEqual(Buffer.from(sig.padEnd(16, '0').slice(0, 16)), Buffer.from(expected));
}
// ─── Config ───────────────────────────────────────────────────────────────────
async function getConfig() {
    const snap = await db.collection(C_CONFIG).doc(CONFIG_DOC).get();
    return snap.exists ? snap.data() : {};
}
// ─── Geo helpers ─────────────────────────────────────────────────────────────
function haversineM(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// ─── Kill switch check ────────────────────────────────────────────────────────
async function isKilled(scope) {
    const checks = ['global'];
    if (scope.cityId)
        checks.push(`city:${scope.cityId}`);
    if (scope.partnerId)
        checks.push(`partner:${scope.partnerId}`);
    if (scope.campaignId)
        checks.push(`campaign:${scope.campaignId}`);
    const snaps = await Promise.all(checks.map((id) => db.collection(C_KILL_SWITCHES).doc(id).get()));
    return snaps.some((s) => { var _a; return s.exists && ((_a = s.data()) === null || _a === void 0 ? void 0 : _a.killed) === true; });
}
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];
const TIER_COOLDOWN = { bronze: 86400, silver: 43200, gold: 21600, platinum: 3600 };
async function getTrustTier(userId) {
    var _a, _b;
    const snap = await db.collection(C_TRUST).doc(userId).get();
    if (!snap.exists)
        return 'bronze';
    return (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.tier) !== null && _b !== void 0 ? _b : 'bronze';
}
function tierAtLeast(userTier, minTier) {
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}
async function evaluateTrustTier(userId) {
    var _a, _b, _c, _d;
    const ref = db.collection(C_TRUST).doc(userId);
    const snap = await ref.get();
    const now = new Date().toISOString();
    if (!snap.exists) {
        await ref.set({ userId, tier: 'bronze', vv30d: 0, rejections30d: 0, pinBruteForceFlags: 0, lastEvaluatedISO: now, lastUpdatedISO: now });
        return;
    }
    const d = snap.data();
    const vv30d = (_a = d.vv30d) !== null && _a !== void 0 ? _a : 0;
    const rejections30d = (_b = d.rejections30d) !== null && _b !== void 0 ? _b : 0;
    const pinFlags = (_c = d.pinBruteForceFlags) !== null && _c !== void 0 ? _c : 0;
    const current = (_d = d.tier) !== null && _d !== void 0 ? _d : 'bronze';
    let next = current;
    if (pinFlags >= 3) {
        next = 'bronze';
    }
    else if (rejections30d >= 3) {
        const idx = Math.max(0, TIER_ORDER.indexOf(current) - 1);
        next = TIER_ORDER[idx];
    }
    else if (vv30d >= 20 && rejections30d === 0) {
        next = 'platinum';
    }
    else if (vv30d >= 10 && rejections30d <= 1) {
        next = TIER_ORDER[Math.min(3, TIER_ORDER.indexOf(current) + 1)];
    }
    await ref.set(Object.assign(Object.assign({}, d), { tier: next, lastEvaluatedISO: now, lastUpdatedISO: now }), { merge: true });
}
// ─── Ledger grant (internal, idempotent) ─────────────────────────────────────
async function ledgerGrant(userId, points, idempotencyKey) {
    var _a, _b;
    const idRef = db.collection(C_EARN_IDEMPOTENCY).doc(idempotencyKey);
    const snap = await idRef.get();
    if (snap.exists)
        return { granted: false, txnId: (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.txnId) !== null && _b !== void 0 ? _b : '' };
    const txnId = db.collection(C_LEDGER_ENTRIES).doc().id;
    const now = new Date().toISOString();
    const batch = db.batch();
    batch.set(idRef, { userId, points, txnId, createdAt: now });
    const entryRef = db.collection(C_LEDGERS).doc(userId).collection(C_LEDGER_ENTRIES).doc(txnId);
    batch.set(entryRef, {
        type: 'earn',
        reason: 'orbpilot_visit',
        amount: points,
        txnId,
        idempotencyKey,
        createdAt: FieldValue.serverTimestamp(),
    });
    const walletRef = db.collection(C_LEDGERS).doc(userId);
    batch.set(walletRef, { balance: FieldValue.increment(points), updatedAt: now }, { merge: true });
    await batch.commit();
    return { granted: true, txnId };
}
// ─── Audit log ────────────────────────────────────────────────────────────────
async function auditLog(entry) {
    await db.collection(C_AUDIT).add(Object.assign(Object.assign({}, entry), { createdAt: new Date().toISOString() }));
}
// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN CRUD (partner-auth)
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotCampaignCreate = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    const cfg = await getConfig();
    const maxBudget = (_a = cfg.maxWeeklyBudgetUsd) !== null && _a !== void 0 ? _a : 500;
    // Validate partner owns partner doc
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    if (!pSnap.exists)
        return { success: false, message: 'Partner not found' };
    const pData = pSnap.data();
    if (pData.ownerUid !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not your partner' };
    const weeklyBudgetUsd = Math.min(Number(d.weeklyBudgetUsd) || 50, maxBudget);
    const dailyMaxUsd = Math.min(Number(d.dailyMaxUsd) || weeklyBudgetUsd / 7, weeklyBudgetUsd);
    const now = new Date().toISOString();
    const weekStart = getWeekStart(new Date());
    const campaign = {
        partnerId,
        locationId: typeof d.locationId === 'string' ? d.locationId : null,
        cityId: typeof d.cityId === 'string' ? d.cityId : null,
        status: 'draft',
        objective: typeof d.objective === 'string' ? d.objective : 'fill_rate',
        weeklyBudgetUsd,
        dailyMaxUsd,
        remainingWeeklyUsd: weeklyBudgetUsd,
        remainingDailyUsd: dailyMaxUsd,
        weekStartISO: weekStart,
        dayISO: now.slice(0, 10),
        schedule: Array.isArray(d.schedule) ? d.schedule : [],
        blackoutDates: Array.isArray(d.blackoutDates) ? d.blackoutDates : [],
        rewardLadder: {
            basePoints: Number((_b = d.rewardLadder) === null || _b === void 0 ? void 0 : _b.basePoints) || DEFAULTS.defaultBasePoints,
            boostPoints: Number((_c = d.rewardLadder) === null || _c === void 0 ? void 0 : _c.boostPoints) || DEFAULTS.defaultBoostPoints,
            rescuePoints: Number((_d = d.rewardLadder) === null || _d === void 0 ? void 0 : _d.rescuePoints) || DEFAULTS.defaultRescuePoints,
        },
        maxVVPerDay: Number(d.maxVVPerDay) || 20,
        maxVVPerUserPerWeek: Number(d.maxVVPerUserPerWeek) || DEFAULTS.maxVVPerUserPerWeek,
        minTrustTier: typeof d.minTrustTier === 'string' ? d.minTrustTier : 'bronze',
        claimRadiusMeters: Number(d.claimRadiusMeters) || DEFAULTS.claimRadiusMeters,
        verifyRadiusMeters: Number(d.verifyRadiusMeters) || DEFAULTS.verifyRadiusMeters,
        maxAccuracyMeters: Number(d.maxAccuracyMeters) || DEFAULTS.maxAccuracyMeters,
        completeWithinSeconds: Number(d.completeWithinSeconds) || DEFAULTS.completeWithinSeconds,
        cpaMaxUsd: Math.min(Number(d.cpaMaxUsd) || DEFAULTS.cpaMaxUsd, (_e = cfg.globalMaxCpaUsd) !== null && _e !== void 0 ? _e : 20),
        pinRequired: d.pinRequired === true,
        walkInEnabled: d.walkInEnabled === true,
        createdAt: now,
        updatedAt: now,
        createdByUid: uid,
    };
    const ref = db.collection(C_CAMPAIGNS).doc();
    await ref.set(campaign);
    await auditLog({ action: 'campaign_create', campaignId: ref.id, partnerId, uid, at: now });
    return { success: true, campaignId: ref.id, campaign: Object.assign({ id: ref.id }, campaign) };
});
exports.orbPilotCampaignGet = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAuth(context);
    const d = data;
    const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
    if (!campaignId)
        return { success: false, message: 'campaignId required' };
    const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
    if (!snap.exists)
        return { success: false, message: 'Not found' };
    return { success: true, campaign: Object.assign({ id: snap.id }, snap.data()) };
});
exports.orbPilotCampaignUpdate = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    const uid = requireAuth(context);
    const d = data;
    const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
    const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
    if (!snap.exists)
        return { success: false, message: 'Not found' };
    const c = snap.data();
    if (c.createdByUid !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not your campaign' };
    if (c.status === 'ended' || c.status === 'killed')
        return { success: false, message: 'Cannot update ended/killed campaign' };
    const cfg = await getConfig();
    const maxBudget = (_a = cfg.maxWeeklyBudgetUsd) !== null && _a !== void 0 ? _a : 500;
    const allowed = {};
    if (d.schedule !== undefined)
        allowed.schedule = d.schedule;
    if (d.blackoutDates !== undefined)
        allowed.blackoutDates = d.blackoutDates;
    if (d.rewardLadder !== undefined)
        allowed.rewardLadder = d.rewardLadder;
    if (d.maxVVPerDay !== undefined)
        allowed.maxVVPerDay = Number(d.maxVVPerDay);
    if (d.maxVVPerUserPerWeek !== undefined)
        allowed.maxVVPerUserPerWeek = Number(d.maxVVPerUserPerWeek);
    if (d.minTrustTier !== undefined)
        allowed.minTrustTier = d.minTrustTier;
    if (d.cpaMaxUsd !== undefined)
        allowed.cpaMaxUsd = Math.min(Number(d.cpaMaxUsd), (_b = cfg.globalMaxCpaUsd) !== null && _b !== void 0 ? _b : 20);
    if (d.pinRequired !== undefined)
        allowed.pinRequired = Boolean(d.pinRequired);
    if (d.weeklyBudgetUsd !== undefined) {
        const newBudget = Math.min(Number(d.weeklyBudgetUsd), maxBudget);
        allowed.weeklyBudgetUsd = newBudget;
        // Can only decrease remaining, not increase beyond new budget
        allowed.remainingWeeklyUsd = Math.min((_c = c.remainingWeeklyUsd) !== null && _c !== void 0 ? _c : newBudget, newBudget);
    }
    if (d.dailyMaxUsd !== undefined) {
        const newDaily = Math.min(Number(d.dailyMaxUsd), (_d = allowed.weeklyBudgetUsd) !== null && _d !== void 0 ? _d : c.weeklyBudgetUsd);
        allowed.dailyMaxUsd = newDaily;
        allowed.remainingDailyUsd = Math.min((_e = c.remainingDailyUsd) !== null && _e !== void 0 ? _e : newDaily, newDaily);
    }
    allowed.updatedAt = new Date().toISOString();
    await db.collection(C_CAMPAIGNS).doc(campaignId).update(allowed);
    await auditLog({ action: 'campaign_update', campaignId, uid, fields: Object.keys(allowed), at: allowed.updatedAt });
    return { success: true };
});
async function setCampaignStatus(campaignId, status, uid, isAdmin, reason) {
    const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
    if (!snap.exists)
        return { success: false, message: 'Not found' };
    const c = snap.data();
    if (c.createdByUid !== uid && !isAdmin)
        return { success: false, message: 'Not your campaign' };
    const update = { status, updatedAt: new Date().toISOString() };
    if (status === 'killed') {
        update.killedBy = uid;
        update.killedAt = update.updatedAt;
        update.killReason = reason !== null && reason !== void 0 ? reason : 'admin_kill';
    }
    await db.collection(C_CAMPAIGNS).doc(campaignId).update(update);
    await auditLog({ action: `campaign_${status}`, campaignId, uid, reason, at: update.updatedAt });
    return { success: true };
}
exports.orbPilotCampaignActivate = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    return setCampaignStatus(d.campaignId, 'active', uid, isAdminCtx(context));
});
exports.orbPilotCampaignPause = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    return setCampaignStatus(d.campaignId, 'paused', uid, isAdminCtx(context));
});
exports.orbPilotCampaignResume = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    return setCampaignStatus(d.campaignId, 'active', uid, isAdminCtx(context));
});
exports.orbPilotCampaignEnd = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    return setCampaignStatus(d.campaignId, 'ended', uid, isAdminCtx(context));
});
// ─────────────────────────────────────────────────────────────────────────────
// ENGINE TICK (admin / system callable)
// ─────────────────────────────────────────────────────────────────────────────
function getWeekStart(d) {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    return mon.toISOString().slice(0, 10);
}
function isoToDate(iso) { return new Date(iso); }
function windowIsOpen(now, startISO, endISO) {
    return now >= isoToDate(startISO) && now < isoToDate(endISO);
}
function computeFillRate(released, used) {
    if (released === 0)
        return 1;
    return used / released;
}
exports.orbPilotEngineTick = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    requireAdmin(context);
    const d = data;
    const nowISO = typeof d.nowISO === 'string' ? d.nowISO : new Date().toISOString();
    const now = new Date(nowISO);
    const dayISO = nowISO.slice(0, 10);
    const weekStart = getWeekStart(now);
    const startMs = Date.now();
    const killGlobal = await db.collection(C_KILL_SWITCHES).doc('global').get();
    if (killGlobal.exists && ((_a = killGlobal.data()) === null || _a === void 0 ? void 0 : _a.killed) === true) {
        return { success: true, message: 'Global kill switch active — tick skipped', slotsReleased: 0 };
    }
    const campaignsSnap = await db.collection(C_CAMPAIGNS).where('status', '==', 'active').get();
    const decisions = [];
    let totalSlotsReleased = 0;
    let windowsOpened = 0;
    for (const campaignDoc of campaignsSnap.docs) {
        const c = campaignDoc.data();
        const campaignId = campaignDoc.id;
        // ── Reset budgets if week/day rolled over
        const updates = {};
        if (c.weekStartISO !== weekStart) {
            updates.weekStartISO = weekStart;
            updates.remainingWeeklyUsd = c.weeklyBudgetUsd;
        }
        if (c.dayISO !== dayISO) {
            updates.dayISO = dayISO;
            updates.remainingDailyUsd = c.dailyMaxUsd;
        }
        if (Object.keys(updates).length > 0) {
            await campaignDoc.ref.update(updates);
            Object.assign(c, updates);
        }
        // ── Budget check
        const remWeekly = (_b = c.remainingWeeklyUsd) !== null && _b !== void 0 ? _b : 0;
        const remDaily = (_c = c.remainingDailyUsd) !== null && _c !== void 0 ? _c : 0;
        if (remWeekly <= 0 || remDaily <= 0) {
            decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'budget_exhausted', slotsReleased: 0, rewardTier: 'base' });
            continue;
        }
        // ── Kill switch per campaign/partner
        const killed = await isKilled({ partnerId: c.partnerId, campaignId });
        if (killed) {
            decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'kill_switch', slotsReleased: 0, rewardTier: 'base' });
            continue;
        }
        // ── Evaluate schedule windows
        const schedule = (_d = c.schedule) !== null && _d !== void 0 ? _d : [];
        const blackouts = (_e = c.blackoutDates) !== null && _e !== void 0 ? _e : [];
        if (blackouts.includes(dayISO)) {
            decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'blackout', slotsReleased: 0, rewardTier: 'base' });
            continue;
        }
        for (const timeWin of schedule) {
            const dow = (_f = timeWin.dow) !== null && _f !== void 0 ? _f : [];
            if (!dow.includes(now.getDay()))
                continue;
            const [sh, sm] = ((_g = timeWin.startTime) !== null && _g !== void 0 ? _g : '09:00').split(':').map(Number);
            const [eh, em] = ((_h = timeWin.endTime) !== null && _h !== void 0 ? _h : '21:00').split(':').map(Number);
            const startISO = `${dayISO}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00Z`;
            const endISO = `${dayISO}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00Z`;
            if (!windowIsOpen(now, startISO, endISO))
                continue;
            // Check if window already created
            const winSnap = await db.collection(C_WINDOWS)
                .where('campaignId', '==', campaignId)
                .where('startISO', '==', startISO)
                .limit(1).get();
            let windowId;
            let existingWindow = null;
            if (winSnap.empty) {
                const winRef = db.collection(C_WINDOWS).doc();
                windowId = winRef.id;
                const winDoc = {
                    campaignId,
                    partnerId: c.partnerId,
                    state: 'open',
                    startISO,
                    endISO,
                    dow: now.getDay(),
                    targetSlotsToRelease: Number(c.maxVVPerDay) || 20,
                    slotsReleased: 0,
                    slotsClaimed: 0,
                    slotsUsed: 0,
                    rewardTier: 'base',
                    createdAt: nowISO,
                };
                await winRef.set(winDoc);
                windowsOpened++;
                existingWindow = winDoc;
            }
            else {
                windowId = winSnap.docs[0].id;
                existingWindow = winSnap.docs[0].data();
            }
            // ── Fill-rate and CPA evaluation
            const slotsReleased = (_j = existingWindow.slotsReleased) !== null && _j !== void 0 ? _j : 0;
            const slotsUsed = (_k = existingWindow.slotsUsed) !== null && _k !== void 0 ? _k : 0;
            const fillRate = computeFillRate(slotsReleased, slotsUsed);
            const ladder = (_l = c.rewardLadder) !== null && _l !== void 0 ? _l : {};
            const basePoints = Number(ladder.basePoints) || DEFAULTS.defaultBasePoints;
            const boostPoints = Number(ladder.boostPoints) || DEFAULTS.defaultBoostPoints;
            const rescuePoints = Number(ladder.rescuePoints) || DEFAULTS.defaultRescuePoints;
            let rewardTier = 'base';
            let rewardPoints = basePoints;
            if (fillRate < 0.25) {
                rewardTier = 'rescue';
                rewardPoints = rescuePoints;
            }
            else if (fillRate < 0.5) {
                rewardTier = 'boost';
                rewardPoints = boostPoints;
            }
            // CPA stop-loss
            const costPerVV = rewardPoints * DEFAULTS.otPointCostUsd;
            const cpaMax = (_m = c.cpaMaxUsd) !== null && _m !== void 0 ? _m : DEFAULTS.cpaMaxUsd;
            if (costPerVV > cpaMax) {
                decisions.push({ campaignId, partnerId: c.partnerId, action: 'stop_loss', reason: `cpa_${costPerVV.toFixed(3)}_exceeds_${cpaMax}`, slotsReleased: 0, rewardTier });
                continue;
            }
            // ── How many slots to release this tick
            const target = Number(c.maxVVPerDay) || 20;
            const alreadyReleased = slotsReleased;
            const slotsLeft = Math.max(0, target - alreadyReleased);
            if (slotsLeft === 0) {
                decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'daily_cap_reached', slotsReleased: 0, rewardTier });
                continue;
            }
            // Release in batches of up to 5
            const toRelease = Math.min(slotsLeft, 5);
            const unclaimedExpiry = new Date(now.getTime() + DEFAULTS.slotUnclaimedExpirySeconds * 1000).toISOString();
            const batch = db.batch();
            for (let i = 0; i < toRelease; i++) {
                const slotRef = db.collection(C_SLOTS).doc();
                batch.set(slotRef, {
                    windowId,
                    campaignId,
                    partnerId: c.partnerId,
                    status: 'released',
                    rewardTier,
                    rewardPoints,
                    releasedISO: nowISO,
                    unclaimedExpiresISO: unclaimedExpiry,
                });
            }
            batch.update(db.collection(C_WINDOWS).doc(windowId), {
                slotsReleased: FieldValue.increment(toRelease),
                rewardTier,
            });
            await batch.commit();
            totalSlotsReleased += toRelease;
            decisions.push({ campaignId, partnerId: c.partnerId, action: 'release', reason: `fill_rate_${fillRate.toFixed(2)}`, slotsReleased: toRelease, rewardTier });
        }
    }
    // ── Expire unclaimed slots
    const expiredSnap = await db.collection(C_SLOTS)
        .where('status', '==', 'released')
        .where('unclaimedExpiresISO', '<', nowISO)
        .limit(200).get();
    const expBatch = db.batch();
    expiredSnap.forEach((doc) => expBatch.update(doc.ref, { status: 'expired', closedISO: nowISO }));
    if (!expiredSnap.empty)
        await expBatch.commit();
    const durationMs = Date.now() - startMs;
    const runRef = db.collection(C_ENGINE_RUNS).doc();
    await runRef.set({
        ranAtISO: nowISO,
        campaignCount: campaignsSnap.size,
        windowsOpened,
        slotsReleased: totalSlotsReleased,
        decisions,
        durationMs,
    });
    return { success: true, slotsReleased: totalSlotsReleased, windowsOpened, campaignCount: campaignsSnap.size, durationMs, runId: runRef.id };
});
// ─────────────────────────────────────────────────────────────────────────────
// OFFER NEARBY (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotOfferNearby = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const uid = requireAuth(context);
    const d = data;
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    const radiusM = Number(d.radiusM) || DEFAULTS.offerSearchRadiusM;
    const nowISO = new Date().toISOString();
    if (await isKilled({ global: true }))
        return { success: true, offers: [] };
    const userTier = await getTrustTier(uid);
    // Get open windows
    const windowsSnap = await db.collection(C_WINDOWS)
        .where('state', '==', 'open')
        .where('endISO', '>', nowISO)
        .limit(50).get();
    if (windowsSnap.empty)
        return { success: true, offers: [] };
    const offers = [];
    const seenPartners = new Set();
    for (const windowDoc of windowsSnap.docs) {
        const win = windowDoc.data();
        const campaignId = win.campaignId;
        // Get campaign
        const cSnap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
        if (!cSnap.exists)
            continue;
        const c = cSnap.data();
        if (c.status !== 'active')
            continue;
        if (seenPartners.has(c.partnerId))
            continue; // dedupe per partner
        // Trust tier gate
        const minTier = (_a = c.minTrustTier) !== null && _a !== void 0 ? _a : 'bronze';
        if (!tierAtLeast(userTier, minTier))
            continue;
        // Get partner location
        const pSnap = await db.collection(C_PARTNERS).doc(c.partnerId).get();
        if (!pSnap.exists)
            continue;
        const p = pSnap.data();
        const partnerLat = Number((_c = (_b = p.geo) === null || _b === void 0 ? void 0 : _b.lat) !== null && _c !== void 0 ? _c : p.lat) || 0;
        const partnerLng = Number((_e = (_d = p.geo) === null || _d === void 0 ? void 0 : _d.lng) !== null && _e !== void 0 ? _e : p.lng) || 0;
        const distM = haversineM(lat, lng, partnerLat, partnerLng);
        if (distM > radiusM)
            continue;
        // Check available slots
        const slotsSnap = await db.collection(C_SLOTS)
            .where('windowId', '==', windowDoc.id)
            .where('status', '==', 'released')
            .limit(1).get();
        if (slotsSnap.empty)
            continue;
        const slot = slotsSnap.docs[0];
        const sData = slot.data();
        // Window time remaining
        const endMs = new Date(win.endISO).getTime();
        const windowMinutesLeft = Math.max(0, Math.round((endMs - Date.now()) / 60000));
        // Reliability score (based on fill rate history — simplified)
        const reliabilityScore = Math.round(Math.min(100, 50 + (Number(win.slotsUsed) / Math.max(1, Number(win.slotsReleased))) * 50));
        // Rank score: closer + more points + more reliable = higher
        const rankScore = (10000 / Math.max(1, distM)) + sData.rewardPoints * 0.5 + reliabilityScore * 0.3;
        seenPartners.add(c.partnerId);
        offers.push({
            slotId: slot.id,
            windowId: windowDoc.id,
            campaignId,
            partnerId: c.partnerId,
            partnerName: (_f = p.name) !== null && _f !== void 0 ? _f : 'Partner',
            partnerCategory: (_g = p.category) !== null && _g !== void 0 ? _g : 'business',
            rewardPoints: sData.rewardPoints,
            rewardTier: sData.rewardTier,
            distanceM: Math.round(distM),
            windowEndsISO: win.endISO,
            windowMinutesLeft,
            reliabilityScore,
            rankScore,
            minTrustTier: minTier,
            walkInEnabled: Boolean(c.walkInEnabled),
        });
    }
    offers.sort((a, b) => b.rankScore - a.rankScore);
    return { success: true, offers: offers.slice(0, DEFAULTS.maxOffersNearby) };
});
// ─────────────────────────────────────────────────────────────────────────────
// SLOT CLAIM (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotOfferClaim = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const slotId = typeof d.slotId === 'string' ? d.slotId : '';
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    if (!slotId)
        return { success: false, message: 'slotId required' };
    const nowISO = new Date().toISOString();
    const claimExpiry = new Date(Date.now() + DEFAULTS.claimExpirySeconds * 1000).toISOString();
    return db.runTransaction(async (tx) => {
        var _a, _b, _c, _d, _e;
        const slotRef = db.collection(C_SLOTS).doc(slotId);
        const snap = await tx.get(slotRef);
        if (!snap.exists)
            throw new functions.https.HttpsError('not-found', 'Slot not found');
        const s = snap.data();
        if (s.status !== 'released')
            return { success: false, message: 'Slot no longer available' };
        if (new Date(s.unclaimedExpiresISO) < new Date())
            return { success: false, message: 'Slot expired' };
        // Kill check
        const killSnap = await tx.get(db.collection(C_KILL_SWITCHES).doc('global'));
        if (killSnap.exists && ((_a = killSnap.data()) === null || _a === void 0 ? void 0 : _a.killed) === true) {
            return { success: false, message: 'OrbPilot temporarily unavailable' };
        }
        // Campaign check
        const cSnap = await tx.get(db.collection(C_CAMPAIGNS).doc(s.campaignId));
        if (!cSnap.exists || cSnap.data().status !== 'active') {
            return { success: false, message: 'Campaign not active' };
        }
        const c = cSnap.data();
        // Geo check for claim radius
        const pSnap = await tx.get(db.collection(C_PARTNERS).doc(s.partnerId));
        const p = pSnap.data();
        const partnerLat = Number((_c = (_b = p.geo) === null || _b === void 0 ? void 0 : _b.lat) !== null && _c !== void 0 ? _c : p.lat) || 0;
        const partnerLng = Number((_e = (_d = p.geo) === null || _d === void 0 ? void 0 : _d.lng) !== null && _e !== void 0 ? _e : p.lng) || 0;
        const distM = haversineM(lat, lng, partnerLat, partnerLng);
        const claimRadius = Number(c.claimRadiusMeters) || DEFAULTS.claimRadiusMeters;
        if (distM > claimRadius)
            return { success: false, message: `You must be within ${claimRadius}m to claim (currently ${Math.round(distM)}m away)` };
        tx.update(slotRef, {
            status: 'claimed',
            claimUserId: uid,
            claimedISO: nowISO,
            claimExpiresISO: claimExpiry,
        });
        tx.update(db.collection(C_WINDOWS).doc(s.windowId), { slotsClaimed: FieldValue.increment(1) });
        return { success: true, slotId, claimExpiresISO: claimExpiry };
    });
});
exports.orbPilotOfferCancel = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const slotId = typeof d.slotId === 'string' ? d.slotId : '';
    const snap = await db.collection(C_SLOTS).doc(slotId).get();
    if (!snap.exists)
        return { success: false, message: 'Slot not found' };
    const s = snap.data();
    if (s.claimUserId !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not your slot' };
    if (s.status !== 'claimed')
        return { success: false, message: 'Slot not in claimed state' };
    await db.collection(C_SLOTS).doc(slotId).update({ status: 'released', claimUserId: FieldValue.delete(), claimedISO: FieldValue.delete(), claimExpiresISO: FieldValue.delete() });
    await db.collection(C_WINDOWS).doc(s.windowId).update({ slotsClaimed: FieldValue.increment(-1) });
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotVerifyInitiate = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : '';
    const slotId = typeof d.slotId === 'string' ? d.slotId : '';
    const qrPayload = typeof d.qrPayload === 'string' ? d.qrPayload : '';
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    const accuracyM = Number(d.accuracyM);
    const nowISO = new Date().toISOString();
    // ── QR signature validation
    const parts = qrPayload.split(':');
    if (parts.length < 3)
        return { success: false, message: 'Invalid QR code format', rejectionReason: 'qr_invalid' };
    const [qrPartnerId, qrWindowId, qrSig] = parts;
    if (qrPartnerId !== partnerId)
        return { success: false, message: 'QR does not match partner', rejectionReason: 'qr_invalid' };
    if (!verifyQrSignature(qrPartnerId, qrWindowId, qrSig))
        return { success: false, message: 'QR signature invalid', rejectionReason: 'qr_invalid' };
    // ── Slot check
    const slotSnap = await db.collection(C_SLOTS).doc(slotId).get();
    if (!slotSnap.exists)
        return { success: false, message: 'Slot not found', rejectionReason: 'slot_not_claimed' };
    const s = slotSnap.data();
    if (s.status !== 'claimed')
        return { success: false, message: 'Slot not in claimed state', rejectionReason: 'slot_not_claimed' };
    if (s.claimUserId !== uid)
        return { success: false, message: 'Slot belongs to another user', rejectionReason: 'slot_wrong_user' };
    if (new Date(s.claimExpiresISO) < new Date())
        return { success: false, message: 'Claim expired', rejectionReason: 'qr_expired' };
    // ── Window open check
    const winSnap = await db.collection(C_WINDOWS).doc(s.windowId).get();
    if (!winSnap.exists)
        return { success: false, message: 'Window not found', rejectionReason: 'window_closed' };
    const win = winSnap.data();
    if (new Date(win.endISO) < new Date())
        return { success: false, message: 'Visit window closed', rejectionReason: 'window_closed' };
    // ── Campaign
    const cSnap = await db.collection(C_CAMPAIGNS).doc(s.campaignId).get();
    const c = cSnap.data();
    const pinRequired = Boolean(c.pinRequired);
    // ── Kill switch
    if (await isKilled({ global: true, partnerId, campaignId: s.campaignId })) {
        return { success: false, message: 'OrbPilot temporarily unavailable', rejectionReason: 'kill_switch' };
    }
    // ── Create attempt
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresISO = new Date(Date.now() + Number(c.completeWithinSeconds || DEFAULTS.completeWithinSeconds) * 1000).toISOString();
    const attemptRef = db.collection(C_ATTEMPTS).doc();
    await attemptRef.set({
        slotId,
        campaignId: s.campaignId,
        partnerId,
        userId: uid,
        outcome: 'pending',
        initiatedISO: nowISO,
        attemptExpiresISO: expiresISO,
        nonce,
        nonceUsed: false,
        requiresPin: pinRequired,
        pinAttempts: 0,
        pinBruteForceFlagged: false,
        initLat: lat,
        initLng: lng,
        initAccuracyM: accuracyM,
        flags: [],
        createdAt: nowISO,
    });
    return {
        success: true,
        attemptId: attemptRef.id,
        nonce,
        requiresPin: pinRequired,
        pinLength: DEFAULTS.pinLength,
        expiresISO,
    };
});
exports.orbPilotVerifyComplete = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const uid = requireAuth(context);
    const d = data;
    const attemptId = typeof d.attemptId === 'string' ? d.attemptId : '';
    const nonce = typeof d.nonce === 'string' ? d.nonce : '';
    const pin = typeof d.pin === 'string' ? d.pin : '';
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    const accuracyM = Number(d.accuracyM);
    const nowISO = new Date().toISOString();
    const attemptRef = db.collection(C_ATTEMPTS).doc(attemptId);
    const attemptSnap = await attemptRef.get();
    if (!attemptSnap.exists)
        return { success: false, outcome: 'rejected', rejectionReason: 'attempt_expired', message: 'Attempt not found' };
    const a = attemptSnap.data();
    if (a.userId !== uid)
        return { success: false, outcome: 'rejected', rejectionReason: 'slot_wrong_user', message: 'Not your attempt' };
    if (a.outcome !== 'pending')
        return { success: false, outcome: a.outcome, rejectionReason: 'idempotent_duplicate', message: 'Attempt already completed' };
    // ── Nonce check
    if (a.nonce !== nonce)
        return { success: false, outcome: 'rejected', rejectionReason: 'nonce_reused', message: 'Security token mismatch' };
    if (a.nonceUsed)
        return { success: false, outcome: 'rejected', rejectionReason: 'nonce_reused', message: 'Security token already used' };
    // ── Expiry check
    if (new Date(a.attemptExpiresISO) < new Date()) {
        await attemptRef.update({ outcome: 'expired', completedISO: nowISO });
        return { success: false, outcome: 'expired', rejectionReason: 'attempt_expired', message: 'Verification attempt expired' };
    }
    // Mark nonce used immediately
    await attemptRef.update({ nonceUsed: true });
    const cSnap = await db.collection(C_CAMPAIGNS).doc(a.campaignId).get();
    const c = cSnap.data();
    // ── PIN check
    if (Boolean(a.requiresPin)) {
        const pinAttempts = (_a = a.pinAttempts) !== null && _a !== void 0 ? _a : 0;
        if (pinAttempts >= DEFAULTS.maxPinAttempts) {
            await attemptRef.update({ outcome: 'rejected', pinBruteForceFlagged: true, completedISO: nowISO });
            await db.collection(C_TRUST).doc(uid).set({ pinBruteForceFlags: FieldValue.increment(1) }, { merge: true });
            return { success: false, outcome: 'rejected', rejectionReason: 'pin_brute_force', message: 'Too many PIN attempts. Please try again later.' };
        }
        const pinSnap = await db.collection(C_PINS).doc(a.partnerId).get();
        const pinData = pinSnap.data();
        const currentPin = pinData === null || pinData === void 0 ? void 0 : pinData.pin;
        const pinExpiry = pinData === null || pinData === void 0 ? void 0 : pinData.expiresISO;
        if (!currentPin || new Date(pinExpiry) < new Date()) {
            await attemptRef.update({ pinAttempts: FieldValue.increment(1) });
            return { success: false, outcome: 'rejected', rejectionReason: 'pin_expired', message: 'PIN expired — ask staff for the new PIN' };
        }
        if (pin !== currentPin) {
            const remaining = DEFAULTS.maxPinAttempts - pinAttempts - 1;
            await attemptRef.update({ pinAttempts: FieldValue.increment(1) });
            return { success: false, outcome: 'rejected', rejectionReason: 'pin_wrong', message: `Incorrect PIN. ${remaining} attempts remaining.`, attemptsRemaining: remaining };
        }
    }
    // ── Geo check
    const pSnap = await db.collection(C_PARTNERS).doc(a.partnerId).get();
    const p = pSnap.data();
    const partnerLat = Number((_c = (_b = p.geo) === null || _b === void 0 ? void 0 : _b.lat) !== null && _c !== void 0 ? _c : p.lat) || 0;
    const partnerLng = Number((_e = (_d = p.geo) === null || _d === void 0 ? void 0 : _d.lng) !== null && _e !== void 0 ? _e : p.lng) || 0;
    const distM = haversineM(lat, lng, partnerLat, partnerLng);
    const verifyRadius = Number(c.verifyRadiusMeters) || DEFAULTS.verifyRadiusMeters;
    const maxAccuracy = Number(c.maxAccuracyMeters) || DEFAULTS.maxAccuracyMeters;
    if (accuracyM > maxAccuracy) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO, completeLat: lat, completeLng: lng, completeAccuracyM: accuracyM });
        return { success: false, outcome: 'rejected', rejectionReason: 'geo_accuracy_low', message: 'GPS accuracy too low. Please try again.' };
    }
    if (distM > verifyRadius) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO, completeLat: lat, completeLng: lng, completeAccuracyM: accuracyM });
        return { success: false, outcome: 'rejected', rejectionReason: 'geo_too_far', message: `You must be within ${verifyRadius}m of the location (currently ${Math.round(distM)}m).` };
    }
    // ── Trust tier check
    const userTier = await getTrustTier(uid);
    const minTier = (_f = c.minTrustTier) !== null && _f !== void 0 ? _f : 'bronze';
    if (!tierAtLeast(userTier, minTier)) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO });
        return { success: false, outcome: 'rejected', rejectionReason: 'trust_tier_insufficient', message: `Requires ${minTier} trust tier.` };
    }
    // ── Cooldown check
    const cooldownSeconds = TIER_COOLDOWN[userTier];
    const cooldownSnap = await db.collection(C_VISITS)
        .where('userId', '==', uid)
        .where('partnerId', '==', a.partnerId)
        .where('outcome', '==', 'verified')
        .orderBy('verifiedISO', 'desc')
        .limit(1).get();
    if (!cooldownSnap.empty) {
        const lastVisitISO = cooldownSnap.docs[0].data().verifiedISO;
        const elapsed = (Date.now() - new Date(lastVisitISO).getTime()) / 1000;
        if (elapsed < cooldownSeconds) {
            await attemptRef.update({ outcome: 'rejected', completedISO: nowISO });
            return { success: false, outcome: 'rejected', rejectionReason: 'cooldown_tier', message: `Please wait ${Math.ceil((cooldownSeconds - elapsed) / 3600)}h before visiting again.` };
        }
    }
    // ── Weekly user cap check
    const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const weeklySnap = await db.collection(C_VISITS)
        .where('userId', '==', uid)
        .where('campaignId', '==', a.campaignId)
        .where('verifiedISO', '>', weekAgo)
        .where('outcome', '==', 'verified')
        .get();
    if (weeklySnap.size >= (Number(c.maxVVPerUserPerWeek) || DEFAULTS.maxVVPerUserPerWeek)) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO });
        return { success: false, outcome: 'rejected', rejectionReason: 'cap_user_weekly', message: 'Weekly visit limit reached for this campaign.' };
    }
    // ── Daily campaign cap check
    const todayISO = nowISO.slice(0, 10);
    const dailySnap = await db.collection(C_VISITS)
        .where('campaignId', '==', a.campaignId)
        .where('verifiedISO', '>', `${todayISO}T00:00:00.000Z`)
        .where('outcome', '==', 'verified')
        .get();
    if (dailySnap.size >= (Number(c.maxVVPerDay) || 20)) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO });
        return { success: false, outcome: 'rejected', rejectionReason: 'cap_campaign_daily', message: 'Campaign daily visit cap reached.' };
    }
    // ── Budget check
    const slotSnap = await db.collection(C_SLOTS).doc(a.slotId).get();
    const s = slotSnap.data();
    const rewardPoints = (_g = s.rewardPoints) !== null && _g !== void 0 ? _g : DEFAULTS.defaultBasePoints;
    const costUsd = rewardPoints * DEFAULTS.otPointCostUsd;
    if (c.remainingWeeklyUsd < costUsd || c.remainingDailyUsd < costUsd) {
        await attemptRef.update({ outcome: 'rejected', completedISO: nowISO });
        return { success: false, outcome: 'rejected', rejectionReason: 'budget_exhausted', message: 'Campaign budget exhausted for today.' };
    }
    // ── Is new customer check
    const prevVisitsSnap = await db.collection(C_VISITS)
        .where('userId', '==', uid)
        .where('partnerId', '==', a.partnerId)
        .where('outcome', '==', 'verified')
        .limit(1).get();
    const isNewCustomer = prevVisitsSnap.empty;
    // ── Idempotent reward grant
    const idempotencyKey = `visit:${attemptId}`;
    const { granted, txnId } = await ledgerGrant(uid, rewardPoints, idempotencyKey);
    // ── Write visit
    const visitRef = db.collection(C_VISITS).doc();
    const visitData = {
        slotId: a.slotId,
        windowId: slotSnap.data().windowId,
        campaignId: a.campaignId,
        partnerId: a.partnerId,
        userId: uid,
        outcome: 'verified',
        initiatedISO: a.initiatedISO,
        verifiedISO: nowISO,
        rewardPoints,
        rewardGranted: granted,
        ledgerTxnId: txnId,
        isNewCustomer,
        lat,
        lng,
        accuracyM,
        distanceM: Math.round(distM),
        pinUsed: Boolean(a.requiresPin),
        createdAt: nowISO,
    };
    const batch = db.batch();
    batch.set(visitRef, visitData);
    batch.update(db.collection(C_SLOTS).doc(a.slotId), { status: 'used', visitId: visitRef.id, closedISO: nowISO });
    batch.update(db.collection(C_WINDOWS).doc(slotSnap.data().windowId), { slotsUsed: FieldValue.increment(1) });
    batch.update(db.collection(C_CAMPAIGNS).doc(a.campaignId), {
        remainingWeeklyUsd: FieldValue.increment(-costUsd),
        remainingDailyUsd: FieldValue.increment(-costUsd),
    });
    batch.update(attemptRef, { outcome: 'verified', visitId: visitRef.id, completedISO: nowISO, completeLat: lat, completeLng: lng, completeAccuracyM: accuracyM });
    batch.set(db.collection(C_TRUST).doc(uid), { vv30d: FieldValue.increment(1) }, { merge: true });
    await batch.commit();
    // Evaluate trust tier async (fire and forget)
    evaluateTrustTier(uid).catch(() => { });
    return { success: true, outcome: 'verified', visitId: visitRef.id, rewardGranted: granted, rewardPoints, ledgerTxnId: txnId };
});
// ─────────────────────────────────────────────────────────────────────────────
// PIN ROTATION (system / partner)
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotPinCurrent = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    // Must own partner or be admin
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const pinSnap = await db.collection(C_PINS).doc(partnerId).get();
    if (!pinSnap.exists)
        return { success: false, message: 'No PIN set — request rotation' };
    const pinData = pinSnap.data();
    if (new Date(pinData.expiresISO) < new Date())
        return { success: false, message: 'PIN expired — request rotation' };
    return { success: true, pin: pinData.pin, expiresISO: pinData.expiresISO };
});
exports.orbPilotPinRotate = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const pin = Array.from({ length: DEFAULTS.pinLength }, () => Math.floor(Math.random() * 10)).join('');
    const expiresISO = new Date(Date.now() + DEFAULTS.pinRotationSeconds * 1000).toISOString();
    await db.collection(C_PINS).doc(partnerId).set({ partnerId, pin, expiresISO, createdAt: new Date().toISOString() });
    return { success: true, pin, expiresISO };
});
// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotMetricsPartner = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a;
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    const fromISO = typeof d.from === 'string' ? d.from : new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const toISO = typeof d.to === 'string' ? d.to : new Date().toISOString();
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const visitsSnap = await db.collection(C_VISITS)
        .where('partnerId', '==', partnerId)
        .where('verifiedISO', '>=', fromISO)
        .where('verifiedISO', '<=', toISO)
        .where('outcome', '==', 'verified')
        .get();
    const visits = visitsSnap.docs.map((d) => d.data());
    const totalVV = visits.length;
    const newCustomerVV = visits.filter((v) => v.isNewCustomer).length;
    const totalPoints = visits.reduce((sum, v) => sum + v.rewardPoints, 0);
    const budgetSpentUsd = totalPoints * DEFAULTS.otPointCostUsd;
    const cpaMeanUsd = totalVV > 0 ? budgetSpentUsd / totalVV : 0;
    const vvByDay = {};
    for (const v of visits) {
        const day = v.verifiedISO.slice(0, 10);
        vvByDay[day] = ((_a = vvByDay[day]) !== null && _a !== void 0 ? _a : 0) + 1;
    }
    return {
        success: true,
        metrics: {
            partnerId,
            fromISO,
            toISO,
            totalVV,
            newCustomerVV,
            repeatCustomerVV: totalVV - newCustomerVV,
            budgetSpentUsd: Math.round(budgetSpentUsd * 100) / 100,
            cpaMeanUsd: Math.round(cpaMeanUsd * 100) / 100,
            vvByDay,
        },
    };
});
exports.orbPilotMetricsCampaign = functions.region('us-central1').https.onCall(async (data, context) => {
    var _a;
    const uid = requireAuth(context);
    const d = data;
    const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
    const fromISO = typeof d.from === 'string' ? d.from : new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const toISO = typeof d.to === 'string' ? d.to : new Date().toISOString();
    const cSnap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
    if (!cSnap.exists)
        return { success: false, message: 'Not found' };
    const c = cSnap.data();
    const pSnap = await db.collection(C_PARTNERS).doc(c.partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const visitsSnap = await db.collection(C_VISITS)
        .where('campaignId', '==', campaignId)
        .where('verifiedISO', '>=', fromISO)
        .where('verifiedISO', '<=', toISO)
        .where('outcome', '==', 'verified')
        .get();
    const visits = visitsSnap.docs.map((d) => d.data());
    const totalVV = visits.length;
    const totalPoints = visits.reduce((sum, v) => sum + v.rewardPoints, 0);
    const budgetSpentUsd = totalPoints * DEFAULTS.otPointCostUsd;
    const vvByDay = {};
    for (const v of visits) {
        const day = v.verifiedISO.slice(0, 10);
        vvByDay[day] = ((_a = vvByDay[day]) !== null && _a !== void 0 ? _a : 0) + 1;
    }
    return {
        success: true,
        metrics: {
            campaignId,
            fromISO,
            toISO,
            totalVV,
            newCustomerVV: visits.filter((v) => v.isNewCustomer).length,
            budgetSpentUsd: Math.round(budgetSpentUsd * 100) / 100,
            cpaMeanUsd: totalVV > 0 ? Math.round((budgetSpentUsd / totalVV) * 100) / 100 : 0,
            vvByDay,
        },
    };
});
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.orbPilotAdminKillSwitch = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const scope = typeof d.scope === 'string' ? d.scope : 'global';
    const targetId = typeof d.targetId === 'string' ? d.targetId : '';
    const kill = Boolean(d.kill);
    const docId = scope === 'global' ? 'global' : `${scope}:${targetId}`;
    await db.collection(C_KILL_SWITCHES).doc(docId).set({ scope, targetId, killed: kill, updatedAt: new Date().toISOString() });
    await auditLog({ action: 'kill_switch', scope, targetId, kill, at: new Date().toISOString() });
    return { success: true, docId, killed: kill };
});
exports.orbPilotAdminAudit = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : null;
    const userId = typeof d.userId === 'string' ? d.userId : null;
    const campaignId = typeof d.campaignId === 'string' ? d.campaignId : null;
    const limit = Math.min(Number(d.limit) || 50, 200);
    let query = db.collection(C_ATTEMPTS).limit(limit);
    if (partnerId)
        query = query.where('partnerId', '==', partnerId);
    if (userId)
        query = query.where('userId', '==', userId);
    if (campaignId)
        query = query.where('campaignId', '==', campaignId);
    const snap = await query.get();
    const attempts = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
    return { success: true, attempts };
});
exports.orbPilotAdminUserTrust = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const userId = typeof d.userId === 'string' ? d.userId : '';
    const tier = typeof d.tier === 'string' ? d.tier : 'bronze';
    const reason = typeof d.reason === 'string' ? d.reason : '';
    const now = new Date().toISOString();
    await db.collection(C_TRUST).doc(userId).set({ tier, adminNote: reason, lastUpdatedISO: now, lastEvaluatedISO: now }, { merge: true });
    await auditLog({ action: 'admin_trust_override', userId, tier, reason, at: now });
    return { success: true };
});
exports.orbPilotAdminPartnerRisk = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : '';
    const riskProfile = typeof d.riskProfile === 'string' ? d.riskProfile : 'low';
    const forcePinRequired = Boolean(d.forcePinRequired);
    const now = new Date().toISOString();
    await db.collection(C_PARTNERS).doc(partnerId).set({ orbPilotRiskProfile: riskProfile, orbPilotForcePinRequired: forcePinRequired, orbPilotRiskUpdatedAt: now }, { merge: true });
    // Also update all active campaigns for this partner
    const campaignsSnap = await db.collection(C_CAMPAIGNS).where('partnerId', '==', partnerId).where('status', 'in', ['active', 'paused']).get();
    const batch = db.batch();
    campaignsSnap.forEach((doc) => batch.update(doc.ref, { pinRequired: forcePinRequired, updatedAt: now }));
    if (!campaignsSnap.empty)
        await batch.commit();
    await auditLog({ action: 'admin_partner_risk', partnerId, riskProfile, forcePinRequired, at: now });
    return { success: true };
});
exports.orbPilotAdminListCampaigns = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const limit = Math.min(Number(d.limit) || 50, 200);
    const snap = await db.collection(C_CAMPAIGNS).orderBy('updatedAt', 'desc').limit(limit).get();
    return { success: true, campaigns: snap.docs.map((d) => (Object.assign({ id: d.id }, d.data()))) };
});
exports.orbPilotAdminListTrust = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const tier = typeof d.tier === 'string' ? d.tier : null;
    const limit = Math.min(Number(d.limit) || 50, 200);
    let query = db.collection(C_TRUST).limit(limit);
    if (tier)
        query = query.where('tier', '==', tier);
    const snap = await query.get();
    return { success: true, users: snap.docs.map((d) => (Object.assign({ id: d.id }, d.data()))) };
});
exports.orbPilotAdminGetConfig = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const cfg = await getConfig();
    return { success: true, config: Object.assign(Object.assign({}, DEFAULTS), cfg) };
});
exports.orbPilotAdminUpdateConfig = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const d = data;
    const allowed = ['maxWeeklyBudgetUsd', 'globalMaxCpaUsd', 'otPointCostUsd', 'boostFillRateThreshold', 'rescueFillRateThreshold', 'maxPinAttempts', 'claimRadiusMeters', 'verifyRadiusMeters', 'maxAccuracyMeters', 'completeWithinSeconds', 'pinRotationSeconds', 'slotUnclaimedExpirySeconds', 'claimExpirySeconds', 'maxOffersNearby'];
    const update = {};
    for (const key of allowed) {
        if (d[key] !== undefined)
            update[key] = d[key];
    }
    await db.collection(C_CONFIG).doc(CONFIG_DOC).set(update, { merge: true });
    await auditLog({ action: 'admin_config_update', fields: Object.keys(update), at: new Date().toISOString() });
    return { success: true };
});
exports.orbPilotAdminEngineLastRun = functions.region('us-central1').https.onCall(async (data, context) => {
    requireAdmin(context);
    const snap = await db.collection(C_ENGINE_RUNS).orderBy('ranAtISO', 'desc').limit(1).get();
    if (snap.empty)
        return { success: true, run: null };
    return { success: true, run: Object.assign({ id: snap.docs[0].id }, snap.docs[0].data()) };
});
exports.orbPilotPartnerListCampaigns = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const snap = await db.collection(C_CAMPAIGNS).where('partnerId', '==', partnerId).orderBy('updatedAt', 'desc').limit(20).get();
    return { success: true, campaigns: snap.docs.map((d) => (Object.assign({ id: d.id }, d.data()))) };
});
exports.orbPilotPartnerActivity = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
    const limit = Math.min(Number(d.limit) || 30, 100);
    const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
    const p = pSnap.data();
    if ((p === null || p === void 0 ? void 0 : p.ownerUid) !== uid && !isAdminCtx(context))
        return { success: false, message: 'Not authorized' };
    const snap = await db.collection(C_ATTEMPTS).where('partnerId', '==', partnerId).orderBy('initiatedISO', 'desc').limit(limit).get();
    // Redact userId for privacy
    const attempts = snap.docs.map((d) => {
        const data = d.data();
        return Object.assign(Object.assign({ id: d.id }, data), { userId: data.userId.slice(0, 8) + '…' });
    });
    return { success: true, attempts };
});
exports.orbPilotUserHistory = functions.region('us-central1').https.onCall(async (data, context) => {
    const uid = requireAuth(context);
    const d = data;
    const limit = Math.min(Number(d.limit) || 20, 100);
    const snap = await db.collection(C_VISITS)
        .where('userId', '==', uid)
        .where('outcome', '==', 'verified')
        .orderBy('verifiedISO', 'desc')
        .limit(limit).get();
    const visits = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
    return { success: true, visits };
});
//# sourceMappingURL=orbPilot.js.map