/**
 * OrbPilot™ — Outcome-First Verified-Visit Autopilot Cloud Functions.
 * Closed-loop: partners set budgets/schedules → engine releases slots →
 * users claim → scan → verify → OT Points granted idempotently.
 *
 * All Firestore writes are backend-only. Clients use callables.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

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

function isAdminCtx(context: functions.https.CallableContext): boolean {
  if (!context.auth) return false;
  const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
  return ADMIN_EMAILS.includes(email);
}

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Not signed in');
  return context.auth.uid;
}

function requireAdmin(context: functions.https.CallableContext): string {
  const uid = requireAuth(context);
  if (!isAdminCtx(context)) throw new functions.https.HttpsError('permission-denied', 'Admin only');
  return uid;
}

/** Verify that `uid` owns the given partner document. Throws permission-denied if not. */
async function assertPartnerOwner(partnerId: string, uid: string): Promise<void> {
  const snap = await db.collection(C_PARTNERS).doc(partnerId).get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Partner not found');
  const data = snap.data() as Record<string, unknown>;
  const owner = data.ownerUid ?? data.uid ?? data.createdByUid;
  if (owner !== uid) {
    // Also allow admin
    const adminEmails = ADMIN_EMAILS;
    const userRec = await admin.auth().getUser(uid).catch(() => null);
    if (!userRec || !adminEmails.includes((userRec.email || '').toLowerCase())) {
      throw new functions.https.HttpsError('permission-denied', 'Not the partner owner');
    }
  }
}

// ─── Secret / HMAC ────────────────────────────────────────────────────────────
function getQrSecret(): string {
  try {
    const raw = process.env['ORPTAPSECRET'];
    if (raw) {
      const parsed = JSON.parse(raw) as { env?: Record<string, string> };
      return parsed?.env?.qr_secret || parsed?.env?.encryption_key || '';
    }
  } catch { /* ignore */ }
  return process.env['QR_SECRET'] || 'dev_secret_change_me';
}

function signQrPayload(payload: string): string {
  return crypto.createHmac('sha256', getQrSecret()).update(payload).digest('hex').slice(0, 16);
}

function verifyQrSignature(partnerId: string, windowId: string, sig: string): boolean {
  const expected = signQrPayload(`${partnerId}:${windowId}`);
  return crypto.timingSafeEqual(Buffer.from(sig.padEnd(16, '0').slice(0, 16)), Buffer.from(expected));
}

// ─── Config ───────────────────────────────────────────────────────────────────
async function getConfig(): Promise<Record<string, unknown>> {
  const snap = await db.collection(C_CONFIG).doc(CONFIG_DOC).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : {};
}

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Kill switch check ────────────────────────────────────────────────────────
async function isKilled(scope: { global?: boolean; cityId?: string; partnerId?: string; campaignId?: string }): Promise<boolean> {
  const checks: string[] = ['global'];
  if (scope.cityId) checks.push(`city:${scope.cityId}`);
  if (scope.partnerId) checks.push(`partner:${scope.partnerId}`);
  if (scope.campaignId) checks.push(`campaign:${scope.campaignId}`);
  const snaps = await Promise.all(checks.map((id) => db.collection(C_KILL_SWITCHES).doc(id).get()));
  return snaps.some((s) => s.exists && (s.data() as Record<string, unknown>)?.killed === true);
}

// ─── Trust tier helpers ───────────────────────────────────────────────────────
type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_ORDER: TrustTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const TIER_COOLDOWN: Record<TrustTier, number> = { bronze: 86400, silver: 43200, gold: 21600, platinum: 3600 };

async function getTrustTier(userId: string): Promise<TrustTier> {
  const snap = await db.collection(C_TRUST).doc(userId).get();
  if (!snap.exists) return 'bronze';
  return ((snap.data() as Record<string, unknown>)?.tier as TrustTier) ?? 'bronze';
}

function tierAtLeast(userTier: TrustTier, minTier: TrustTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}

async function evaluateTrustTier(userId: string): Promise<void> {
  const ref = db.collection(C_TRUST).doc(userId);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    await ref.set({ userId, tier: 'bronze', vv30d: 0, rejections30d: 0, pinBruteForceFlags: 0, lastEvaluatedISO: now, lastUpdatedISO: now });
    return;
  }
  const d = snap.data() as Record<string, unknown>;
  const vv30d = (d.vv30d as number) ?? 0;
  const rejections30d = (d.rejections30d as number) ?? 0;
  const pinFlags = (d.pinBruteForceFlags as number) ?? 0;
  const current: TrustTier = (d.tier as TrustTier) ?? 'bronze';
  let next = current;

  if (pinFlags >= 3) {
    next = 'bronze';
  } else if (rejections30d >= 3) {
    const idx = Math.max(0, TIER_ORDER.indexOf(current) - 1);
    next = TIER_ORDER[idx] as TrustTier;
  } else if (vv30d >= 20 && rejections30d === 0) {
    next = 'platinum';
  } else if (vv30d >= 10 && rejections30d <= 1) {
    next = TIER_ORDER[Math.min(3, TIER_ORDER.indexOf(current) + 1)] as TrustTier;
  }

  await ref.set({ ...d, tier: next, lastEvaluatedISO: now, lastUpdatedISO: now }, { merge: true });
}

// ─── Ledger grant (internal, idempotent) ─────────────────────────────────────
async function ledgerGrant(userId: string, points: number, idempotencyKey: string): Promise<{ granted: boolean; txnId: string }> {
  const idRef = db.collection(C_EARN_IDEMPOTENCY).doc(idempotencyKey);
  const snap = await idRef.get();
  if (snap.exists) return { granted: false, txnId: (snap.data() as Record<string, unknown>)?.txnId as string ?? '' };

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
async function auditLog(entry: Record<string, unknown>): Promise<void> {
  await db.collection(C_AUDIT).add({ ...entry, createdAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN CRUD (partner-auth)
// ─────────────────────────────────────────────────────────────────────────────

export const orbPilotCampaignCreate = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
  const cfg = await getConfig();
  const maxBudget = (cfg.maxWeeklyBudgetUsd as number) ?? 500;

  // Validate partner owns partner doc
  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  if (!pSnap.exists) return { success: false, message: 'Partner not found' };
  const pData = pSnap.data() as Record<string, unknown>;
  if (pData.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not your partner' };

  const weeklyBudgetUsd = Math.min(Number(d.weeklyBudgetUsd) || 50, maxBudget);
  const dailyMaxUsd = Math.min(Number(d.dailyMaxUsd) || weeklyBudgetUsd / 7, weeklyBudgetUsd);
  const now = new Date().toISOString();
  const weekStart = getWeekStart(new Date());

  const campaign: Record<string, unknown> = {
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
      basePoints: Number((d.rewardLadder as Record<string, unknown>)?.basePoints) || DEFAULTS.defaultBasePoints,
      boostPoints: Number((d.rewardLadder as Record<string, unknown>)?.boostPoints) || DEFAULTS.defaultBoostPoints,
      rescuePoints: Number((d.rewardLadder as Record<string, unknown>)?.rescuePoints) || DEFAULTS.defaultRescuePoints,
    },
    maxVVPerDay: Number(d.maxVVPerDay) || 20,
    maxVVPerUserPerWeek: Number(d.maxVVPerUserPerWeek) || DEFAULTS.maxVVPerUserPerWeek,
    minTrustTier: typeof d.minTrustTier === 'string' ? d.minTrustTier : 'bronze',
    claimRadiusMeters: Number(d.claimRadiusMeters) || DEFAULTS.claimRadiusMeters,
    verifyRadiusMeters: Number(d.verifyRadiusMeters) || DEFAULTS.verifyRadiusMeters,
    maxAccuracyMeters: Number(d.maxAccuracyMeters) || DEFAULTS.maxAccuracyMeters,
    completeWithinSeconds: Number(d.completeWithinSeconds) || DEFAULTS.completeWithinSeconds,
    cpaMaxUsd: Math.min(Number(d.cpaMaxUsd) || DEFAULTS.cpaMaxUsd, (cfg.globalMaxCpaUsd as number) ?? 20),
    pinRequired: d.pinRequired === true,
    walkInEnabled: d.walkInEnabled === true,
    createdAt: now,
    updatedAt: now,
    createdByUid: uid,
  };

  const ref = db.collection(C_CAMPAIGNS).doc();
  await ref.set(campaign);
  await auditLog({ action: 'campaign_create', campaignId: ref.id, partnerId, uid, at: now });
  return { success: true, campaignId: ref.id, campaign: { id: ref.id, ...campaign } };
});

export const orbPilotCampaignGet = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAuth(context);
  const d = data as Record<string, unknown>;
  const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
  if (!campaignId) return { success: false, message: 'campaignId required' };
  const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
  if (!snap.exists) return { success: false, message: 'Not found' };
  return { success: true, campaign: { id: snap.id, ...snap.data() } };
});

export const orbPilotCampaignUpdate = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
  const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
  if (!snap.exists) return { success: false, message: 'Not found' };
  const c = snap.data() as Record<string, unknown>;
  if (c.createdByUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not your campaign' };
  if ((c.status as string) === 'ended' || (c.status as string) === 'killed') return { success: false, message: 'Cannot update ended/killed campaign' };

  const cfg = await getConfig();
  const maxBudget = (cfg.maxWeeklyBudgetUsd as number) ?? 500;
  const allowed: Record<string, unknown> = {};
  if (d.schedule !== undefined) allowed.schedule = d.schedule;
  if (d.blackoutDates !== undefined) allowed.blackoutDates = d.blackoutDates;
  if (d.rewardLadder !== undefined) allowed.rewardLadder = d.rewardLadder;
  if (d.maxVVPerDay !== undefined) allowed.maxVVPerDay = Number(d.maxVVPerDay);
  if (d.maxVVPerUserPerWeek !== undefined) allowed.maxVVPerUserPerWeek = Number(d.maxVVPerUserPerWeek);
  if (d.minTrustTier !== undefined) allowed.minTrustTier = d.minTrustTier;
  if (d.cpaMaxUsd !== undefined) allowed.cpaMaxUsd = Math.min(Number(d.cpaMaxUsd), (cfg.globalMaxCpaUsd as number) ?? 20);
  if (d.pinRequired !== undefined) allowed.pinRequired = Boolean(d.pinRequired);
  if (d.weeklyBudgetUsd !== undefined) {
    const newBudget = Math.min(Number(d.weeklyBudgetUsd), maxBudget);
    allowed.weeklyBudgetUsd = newBudget;
    // Can only decrease remaining, not increase beyond new budget
    allowed.remainingWeeklyUsd = Math.min((c.remainingWeeklyUsd as number) ?? newBudget, newBudget);
  }
  if (d.dailyMaxUsd !== undefined) {
    const newDaily = Math.min(Number(d.dailyMaxUsd), (allowed.weeklyBudgetUsd as number) ?? (c.weeklyBudgetUsd as number));
    allowed.dailyMaxUsd = newDaily;
    allowed.remainingDailyUsd = Math.min((c.remainingDailyUsd as number) ?? newDaily, newDaily);
  }
  allowed.updatedAt = new Date().toISOString();
  await db.collection(C_CAMPAIGNS).doc(campaignId).update(allowed);
  await auditLog({ action: 'campaign_update', campaignId, uid, fields: Object.keys(allowed), at: allowed.updatedAt });
  return { success: true };
});

async function setCampaignStatus(campaignId: string, status: string, uid: string, isAdmin: boolean, reason?: string): Promise<{ success: boolean; message?: string }> {
  const snap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
  if (!snap.exists) return { success: false, message: 'Not found' };
  const c = snap.data() as Record<string, unknown>;
  if (c.createdByUid !== uid && !isAdmin) return { success: false, message: 'Not your campaign' };
  const update: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
  if (status === 'killed') { update.killedBy = uid; update.killedAt = update.updatedAt; update.killReason = reason ?? 'admin_kill'; }
  await db.collection(C_CAMPAIGNS).doc(campaignId).update(update);
  await auditLog({ action: `campaign_${status}`, campaignId, uid, reason, at: update.updatedAt });
  return { success: true };
}

export const orbPilotCampaignActivate = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  return setCampaignStatus(d.campaignId as string, 'active', uid, isAdminCtx(context));
});

export const orbPilotCampaignPause = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  return setCampaignStatus(d.campaignId as string, 'paused', uid, isAdminCtx(context));
});

export const orbPilotCampaignResume = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  return setCampaignStatus(d.campaignId as string, 'active', uid, isAdminCtx(context));
});

export const orbPilotCampaignEnd = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  return setCampaignStatus(d.campaignId as string, 'ended', uid, isAdminCtx(context));
});

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE TICK (admin / system callable)
// ─────────────────────────────────────────────────────────────────────────────

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function isoToDate(iso: string): Date { return new Date(iso); }

function windowIsOpen(now: Date, startISO: string, endISO: string): boolean {
  return now >= isoToDate(startISO) && now < isoToDate(endISO);
}

function computeFillRate(released: number, used: number): number {
  if (released === 0) return 1;
  return used / released;
}

export const orbPilotEngineTick = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const nowISO = typeof d.nowISO === 'string' ? d.nowISO : new Date().toISOString();
  const now = new Date(nowISO);
  const dayISO = nowISO.slice(0, 10);
  const weekStart = getWeekStart(now);
  const startMs = Date.now();

  const killGlobal = await db.collection(C_KILL_SWITCHES).doc('global').get();
  if (killGlobal.exists && (killGlobal.data() as Record<string, unknown>)?.killed === true) {
    return { success: true, message: 'Global kill switch active — tick skipped', slotsReleased: 0 };
  }

  const campaignsSnap = await db.collection(C_CAMPAIGNS).where('status', '==', 'active').get();
  const decisions: Array<Record<string, unknown>> = [];
  let totalSlotsReleased = 0;
  let windowsOpened = 0;

  for (const campaignDoc of campaignsSnap.docs) {
    const c = campaignDoc.data() as Record<string, unknown>;
    const campaignId = campaignDoc.id;

    // ── Reset budgets if week/day rolled over
    const updates: Record<string, unknown> = {};
    if ((c.weekStartISO as string) !== weekStart) {
      updates.weekStartISO = weekStart;
      updates.remainingWeeklyUsd = c.weeklyBudgetUsd;
    }
    if ((c.dayISO as string) !== dayISO) {
      updates.dayISO = dayISO;
      updates.remainingDailyUsd = c.dailyMaxUsd;
    }
    if (Object.keys(updates).length > 0) {
      await campaignDoc.ref.update(updates);
      Object.assign(c, updates);
    }

    // ── Budget check
    const remWeekly = (c.remainingWeeklyUsd as number) ?? 0;
    const remDaily = (c.remainingDailyUsd as number) ?? 0;
    if (remWeekly <= 0 || remDaily <= 0) {
      decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'budget_exhausted', slotsReleased: 0, rewardTier: 'base' });
      continue;
    }

    // ── Kill switch per campaign/partner
    const killed = await isKilled({ partnerId: c.partnerId as string, campaignId });
    if (killed) {
      decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'kill_switch', slotsReleased: 0, rewardTier: 'base' });
      continue;
    }

    // ── Evaluate schedule windows
    const schedule = (c.schedule as Array<Record<string, unknown>>) ?? [];
    const blackouts = (c.blackoutDates as string[]) ?? [];
    if (blackouts.includes(dayISO)) {
      decisions.push({ campaignId, partnerId: c.partnerId, action: 'skip', reason: 'blackout', slotsReleased: 0, rewardTier: 'base' });
      continue;
    }

    for (const timeWin of schedule) {
      const dow = (timeWin.dow as number[]) ?? [];
      if (!dow.includes(now.getDay())) continue;

      const [sh, sm] = ((timeWin.startTime as string) ?? '09:00').split(':').map(Number);
      const [eh, em] = ((timeWin.endTime as string) ?? '21:00').split(':').map(Number);
      const startISO = `${dayISO}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00Z`;
      const endISO = `${dayISO}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00Z`;

      if (!windowIsOpen(now, startISO, endISO)) continue;

      // Check if window already created
      const winSnap = await db.collection(C_WINDOWS)
        .where('campaignId', '==', campaignId)
        .where('startISO', '==', startISO)
        .limit(1).get();

      let windowId: string;
      let existingWindow: Record<string, unknown> | null = null;
      if (winSnap.empty) {
        const winRef = db.collection(C_WINDOWS).doc();
        windowId = winRef.id;
        const winDoc: Record<string, unknown> = {
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
      } else {
        windowId = winSnap.docs[0].id;
        existingWindow = winSnap.docs[0].data() as Record<string, unknown>;
      }

      // ── Fill-rate and CPA evaluation
      const slotsReleased = (existingWindow.slotsReleased as number) ?? 0;
      const slotsUsed = (existingWindow.slotsUsed as number) ?? 0;
      const fillRate = computeFillRate(slotsReleased, slotsUsed);
      const ladder = (c.rewardLadder as Record<string, unknown>) ?? {};
      const basePoints = Number(ladder.basePoints) || DEFAULTS.defaultBasePoints;
      const boostPoints = Number(ladder.boostPoints) || DEFAULTS.defaultBoostPoints;
      const rescuePoints = Number(ladder.rescuePoints) || DEFAULTS.defaultRescuePoints;

      let rewardTier: 'base' | 'boost' | 'rescue' = 'base';
      let rewardPoints = basePoints;
      if (fillRate < 0.25) { rewardTier = 'rescue'; rewardPoints = rescuePoints; }
      else if (fillRate < 0.5) { rewardTier = 'boost'; rewardPoints = boostPoints; }

      // CPA stop-loss
      const costPerVV = rewardPoints * DEFAULTS.otPointCostUsd;
      const cpaMax = (c.cpaMaxUsd as number) ?? DEFAULTS.cpaMaxUsd;
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
  if (!expiredSnap.empty) await expBatch.commit();

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

export const orbPilotOfferNearby = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const radiusM = Number(d.radiusM) || DEFAULTS.offerSearchRadiusM;
  const nowISO = new Date().toISOString();

  if (await isKilled({ global: true })) return { success: true, offers: [] };

  const userTier = await getTrustTier(uid);

  // Get open windows
  const windowsSnap = await db.collection(C_WINDOWS)
    .where('state', '==', 'open')
    .where('endISO', '>', nowISO)
    .limit(50).get();

  if (windowsSnap.empty) return { success: true, offers: [] };

  const offers: Array<Record<string, unknown>> = [];
  const seenPartners = new Set<string>();

  for (const windowDoc of windowsSnap.docs) {
    const win = windowDoc.data() as Record<string, unknown>;
    const campaignId = win.campaignId as string;

    // Get campaign
    const cSnap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
    if (!cSnap.exists) continue;
    const c = cSnap.data() as Record<string, unknown>;
    if ((c.status as string) !== 'active') continue;
    if (seenPartners.has(c.partnerId as string)) continue; // dedupe per partner

    // Trust tier gate
    const minTier = (c.minTrustTier as string) ?? 'bronze';
    if (!tierAtLeast(userTier, minTier as TrustTier)) continue;

    // Get partner location
    const pSnap = await db.collection(C_PARTNERS).doc(c.partnerId as string).get();
    if (!pSnap.exists) continue;
    const p = pSnap.data() as Record<string, unknown>;
    const partnerLat = Number((p.geo as Record<string, unknown>)?.lat ?? p.lat) || 0;
    const partnerLng = Number((p.geo as Record<string, unknown>)?.lng ?? p.lng) || 0;

    const distM = haversineM(lat, lng, partnerLat, partnerLng);
    if (distM > radiusM) continue;

    // Check available slots
    const slotsSnap = await db.collection(C_SLOTS)
      .where('windowId', '==', windowDoc.id)
      .where('status', '==', 'released')
      .limit(1).get();
    if (slotsSnap.empty) continue;

    const slot = slotsSnap.docs[0];
    const sData = slot.data() as Record<string, unknown>;

    // Window time remaining
    const endMs = new Date(win.endISO as string).getTime();
    const windowMinutesLeft = Math.max(0, Math.round((endMs - Date.now()) / 60000));

    // Reliability score (based on fill rate history — simplified)
    const reliabilityScore = Math.round(
      Math.min(100, 50 + (Number(win.slotsUsed) / Math.max(1, Number(win.slotsReleased))) * 50)
    );

    // Rank score: closer + more points + more reliable = higher
    const rankScore = (10000 / Math.max(1, distM)) + (sData.rewardPoints as number) * 0.5 + reliabilityScore * 0.3;

    seenPartners.add(c.partnerId as string);
    offers.push({
      slotId: slot.id,
      windowId: windowDoc.id,
      campaignId,
      partnerId: c.partnerId,
      partnerName: (p.name as string) ?? 'Partner',
      partnerCategory: (p.category as string) ?? 'business',
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

  offers.sort((a, b) => (b.rankScore as number) - (a.rankScore as number));
  return { success: true, offers: offers.slice(0, DEFAULTS.maxOffersNearby) };
});

// ─────────────────────────────────────────────────────────────────────────────
// SLOT CLAIM (user)
// ─────────────────────────────────────────────────────────────────────────────

export const orbPilotOfferClaim = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const slotId = typeof d.slotId === 'string' ? d.slotId : '';
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  if (!slotId) return { success: false, message: 'slotId required' };

  const nowISO = new Date().toISOString();
  const claimExpiry = new Date(Date.now() + DEFAULTS.claimExpirySeconds * 1000).toISOString();

  return db.runTransaction(async (tx) => {
    const slotRef = db.collection(C_SLOTS).doc(slotId);
    const snap = await tx.get(slotRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Slot not found');
    const s = snap.data() as Record<string, unknown>;
    if ((s.status as string) !== 'released') return { success: false, message: 'Slot no longer available' };
    if (new Date(s.unclaimedExpiresISO as string) < new Date()) return { success: false, message: 'Slot expired' };

    // Kill check
    const killSnap = await tx.get(db.collection(C_KILL_SWITCHES).doc('global'));
    if (killSnap.exists && (killSnap.data() as Record<string, unknown>)?.killed === true) {
      return { success: false, message: 'OrbPilot temporarily unavailable' };
    }

    // Campaign check
    const cSnap = await tx.get(db.collection(C_CAMPAIGNS).doc(s.campaignId as string));
    if (!cSnap.exists || (cSnap.data() as Record<string, unknown>).status !== 'active') {
      return { success: false, message: 'Campaign not active' };
    }
    const c = cSnap.data() as Record<string, unknown>;

    // Geo check for claim radius
    const pSnap = await tx.get(db.collection(C_PARTNERS).doc(s.partnerId as string));
    const p = pSnap.data() as Record<string, unknown>;
    const partnerLat = Number((p.geo as Record<string, unknown>)?.lat ?? p.lat) || 0;
    const partnerLng = Number((p.geo as Record<string, unknown>)?.lng ?? p.lng) || 0;
    const distM = haversineM(lat, lng, partnerLat, partnerLng);
    const claimRadius = Number(c.claimRadiusMeters) || DEFAULTS.claimRadiusMeters;
    if (distM > claimRadius) return { success: false, message: `You must be within ${claimRadius}m to claim (currently ${Math.round(distM)}m away)` };

    tx.update(slotRef, {
      status: 'claimed',
      claimUserId: uid,
      claimedISO: nowISO,
      claimExpiresISO: claimExpiry,
    });
    tx.update(db.collection(C_WINDOWS).doc(s.windowId as string), { slotsClaimed: FieldValue.increment(1) });
    return { success: true, slotId, claimExpiresISO: claimExpiry };
  });
});

export const orbPilotOfferCancel = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const slotId = typeof d.slotId === 'string' ? d.slotId : '';
  const snap = await db.collection(C_SLOTS).doc(slotId).get();
  if (!snap.exists) return { success: false, message: 'Slot not found' };
  const s = snap.data() as Record<string, unknown>;
  if (s.claimUserId !== uid && !isAdminCtx(context)) return { success: false, message: 'Not your slot' };
  if ((s.status as string) !== 'claimed') return { success: false, message: 'Slot not in claimed state' };
  await db.collection(C_SLOTS).doc(slotId).update({ status: 'released', claimUserId: FieldValue.delete(), claimedISO: FieldValue.delete(), claimExpiresISO: FieldValue.delete() });
  await db.collection(C_WINDOWS).doc(s.windowId as string).update({ slotsClaimed: FieldValue.increment(-1) });
  return { success: true };
});

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION (user)
// ─────────────────────────────────────────────────────────────────────────────

export const orbPilotVerifyInitiate = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : '';
  const slotId = typeof d.slotId === 'string' ? d.slotId : '';
  const qrPayload = typeof d.qrPayload === 'string' ? d.qrPayload : '';
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const accuracyM = Number(d.accuracyM);
  const nowISO = new Date().toISOString();

  // ── QR signature validation
  const parts = qrPayload.split(':');
  if (parts.length < 3) return { success: false, message: 'Invalid QR code format', rejectionReason: 'qr_invalid' };
  const [qrPartnerId, qrWindowId, qrSig] = parts as [string, string, string];
  if (qrPartnerId !== partnerId) return { success: false, message: 'QR does not match partner', rejectionReason: 'qr_invalid' };
  if (!verifyQrSignature(qrPartnerId, qrWindowId, qrSig)) return { success: false, message: 'QR signature invalid', rejectionReason: 'qr_invalid' };

  // ── Slot check
  const slotSnap = await db.collection(C_SLOTS).doc(slotId).get();
  if (!slotSnap.exists) return { success: false, message: 'Slot not found', rejectionReason: 'slot_not_claimed' };
  const s = slotSnap.data() as Record<string, unknown>;
  if ((s.status as string) !== 'claimed') return { success: false, message: 'Slot not in claimed state', rejectionReason: 'slot_not_claimed' };
  if (s.claimUserId !== uid) return { success: false, message: 'Slot belongs to another user', rejectionReason: 'slot_wrong_user' };
  if (new Date(s.claimExpiresISO as string) < new Date()) return { success: false, message: 'Claim expired', rejectionReason: 'qr_expired' };

  // ── Window open check
  const winSnap = await db.collection(C_WINDOWS).doc(s.windowId as string).get();
  if (!winSnap.exists) return { success: false, message: 'Window not found', rejectionReason: 'window_closed' };
  const win = winSnap.data() as Record<string, unknown>;
  if (new Date(win.endISO as string) < new Date()) return { success: false, message: 'Visit window closed', rejectionReason: 'window_closed' };

  // ── Campaign
  const cSnap = await db.collection(C_CAMPAIGNS).doc(s.campaignId as string).get();
  const c = cSnap.data() as Record<string, unknown>;
  const pinRequired = Boolean(c.pinRequired);

  // ── Kill switch
  if (await isKilled({ global: true, partnerId, campaignId: s.campaignId as string })) {
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

export const orbPilotVerifyComplete = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const attemptId = typeof d.attemptId === 'string' ? d.attemptId : '';
  const nonce = typeof d.nonce === 'string' ? d.nonce : '';
  const pin = typeof d.pin === 'string' ? d.pin : '';
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const accuracyM = Number(d.accuracyM);
  const nowISO = new Date().toISOString();

  const attemptRef = db.collection(C_ATTEMPTS).doc(attemptId);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) return { success: false, outcome: 'rejected', rejectionReason: 'attempt_expired', message: 'Attempt not found' };
  const a = attemptSnap.data() as Record<string, unknown>;
  if (a.userId !== uid) return { success: false, outcome: 'rejected', rejectionReason: 'slot_wrong_user', message: 'Not your attempt' };
  if ((a.outcome as string) !== 'pending') return { success: false, outcome: a.outcome, rejectionReason: 'idempotent_duplicate', message: 'Attempt already completed' };

  // ── Nonce check
  if (a.nonce !== nonce) return { success: false, outcome: 'rejected', rejectionReason: 'nonce_reused', message: 'Security token mismatch' };
  if (a.nonceUsed) return { success: false, outcome: 'rejected', rejectionReason: 'nonce_reused', message: 'Security token already used' };

  // ── Expiry check
  if (new Date(a.attemptExpiresISO as string) < new Date()) {
    await attemptRef.update({ outcome: 'expired', completedISO: nowISO });
    return { success: false, outcome: 'expired', rejectionReason: 'attempt_expired', message: 'Verification attempt expired' };
  }

  // Mark nonce used immediately
  await attemptRef.update({ nonceUsed: true });

  const cSnap = await db.collection(C_CAMPAIGNS).doc(a.campaignId as string).get();
  const c = cSnap.data() as Record<string, unknown>;

  // ── PIN check
  if (Boolean(a.requiresPin)) {
    const pinAttempts = (a.pinAttempts as number) ?? 0;
    if (pinAttempts >= DEFAULTS.maxPinAttempts) {
      await attemptRef.update({ outcome: 'rejected', pinBruteForceFlagged: true, completedISO: nowISO });
      await db.collection(C_TRUST).doc(uid).set({ pinBruteForceFlags: FieldValue.increment(1) }, { merge: true });
      return { success: false, outcome: 'rejected', rejectionReason: 'pin_brute_force', message: 'Too many PIN attempts. Please try again later.' };
    }
    const pinSnap = await db.collection(C_PINS).doc(a.partnerId as string).get();
    const pinData = pinSnap.data() as Record<string, unknown>;
    const currentPin = pinData?.pin as string;
    const pinExpiry = pinData?.expiresISO as string;
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
  const pSnap = await db.collection(C_PARTNERS).doc(a.partnerId as string).get();
  const p = pSnap.data() as Record<string, unknown>;
  const partnerLat = Number((p.geo as Record<string, unknown>)?.lat ?? p.lat) || 0;
  const partnerLng = Number((p.geo as Record<string, unknown>)?.lng ?? p.lng) || 0;
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
  const minTier = (c.minTrustTier as string) ?? 'bronze';
  if (!tierAtLeast(userTier, minTier as TrustTier)) {
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
    const lastVisitISO = (cooldownSnap.docs[0].data() as Record<string, unknown>).verifiedISO as string;
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
  const slotSnap = await db.collection(C_SLOTS).doc(a.slotId as string).get();
  const s = slotSnap.data() as Record<string, unknown>;
  const rewardPoints = (s.rewardPoints as number) ?? DEFAULTS.defaultBasePoints;
  const costUsd = rewardPoints * DEFAULTS.otPointCostUsd;
  if ((c.remainingWeeklyUsd as number) < costUsd || (c.remainingDailyUsd as number) < costUsd) {
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
  const visitData: Record<string, unknown> = {
    slotId: a.slotId,
    windowId: (slotSnap.data() as Record<string, unknown>).windowId,
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
  batch.update(db.collection(C_SLOTS).doc(a.slotId as string), { status: 'used', visitId: visitRef.id, closedISO: nowISO });
  batch.update(db.collection(C_WINDOWS).doc((slotSnap.data() as Record<string, unknown>).windowId as string), { slotsUsed: FieldValue.increment(1) });
  batch.update(db.collection(C_CAMPAIGNS).doc(a.campaignId as string), {
    remainingWeeklyUsd: FieldValue.increment(-costUsd),
    remainingDailyUsd: FieldValue.increment(-costUsd),
  });
  batch.update(attemptRef, { outcome: 'verified', visitId: visitRef.id, completedISO: nowISO, completeLat: lat, completeLng: lng, completeAccuracyM: accuracyM });
  batch.set(db.collection(C_TRUST).doc(uid), { vv30d: FieldValue.increment(1) }, { merge: true });
  await batch.commit();

  // Evaluate trust tier async (fire and forget)
  evaluateTrustTier(uid).catch(() => {});

  return { success: true, outcome: 'verified', visitId: visitRef.id, rewardGranted: granted, rewardPoints, ledgerTxnId: txnId };
});

// ─────────────────────────────────────────────────────────────────────────────
// PIN ROTATION (system / partner)
// ─────────────────────────────────────────────────────────────────────────────

export const orbPilotPinCurrent = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;

  // Must own partner or be admin
  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };

  const pinSnap = await db.collection(C_PINS).doc(partnerId).get();
  if (!pinSnap.exists) return { success: false, message: 'No PIN set — request rotation' };
  const pinData = pinSnap.data() as Record<string, unknown>;
  if (new Date(pinData.expiresISO as string) < new Date()) return { success: false, message: 'PIN expired — request rotation' };
  return { success: true, pin: pinData.pin, expiresISO: pinData.expiresISO };
});

export const orbPilotPinRotate = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;

  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };

  const pin = Array.from({ length: DEFAULTS.pinLength }, () => Math.floor(Math.random() * 10)).join('');
  const expiresISO = new Date(Date.now() + DEFAULTS.pinRotationSeconds * 1000).toISOString();
  await db.collection(C_PINS).doc(partnerId).set({ partnerId, pin, expiresISO, createdAt: new Date().toISOString() });
  return { success: true, pin, expiresISO };
});

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const orbPilotMetricsPartner = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
  const fromISO = typeof d.from === 'string' ? d.from : new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const toISO = typeof d.to === 'string' ? d.to : new Date().toISOString();

  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };

  const visitsSnap = await db.collection(C_VISITS)
    .where('partnerId', '==', partnerId)
    .where('verifiedISO', '>=', fromISO)
    .where('verifiedISO', '<=', toISO)
    .where('outcome', '==', 'verified')
    .get();

  const visits = visitsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const totalVV = visits.length;
  const newCustomerVV = visits.filter((v) => v.isNewCustomer).length;
  const totalPoints = visits.reduce((sum, v) => sum + (v.rewardPoints as number), 0);
  const budgetSpentUsd = totalPoints * DEFAULTS.otPointCostUsd;
  const cpaMeanUsd = totalVV > 0 ? budgetSpentUsd / totalVV : 0;

  const vvByDay: Record<string, number> = {};
  for (const v of visits) {
    const day = (v.verifiedISO as string).slice(0, 10);
    vvByDay[day] = (vvByDay[day] ?? 0) + 1;
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

export const orbPilotMetricsCampaign = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const campaignId = typeof d.campaignId === 'string' ? d.campaignId : '';
  const fromISO = typeof d.from === 'string' ? d.from : new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const toISO = typeof d.to === 'string' ? d.to : new Date().toISOString();

  const cSnap = await db.collection(C_CAMPAIGNS).doc(campaignId).get();
  if (!cSnap.exists) return { success: false, message: 'Not found' };
  const c = cSnap.data() as Record<string, unknown>;
  const pSnap = await db.collection(C_PARTNERS).doc(c.partnerId as string).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };

  const visitsSnap = await db.collection(C_VISITS)
    .where('campaignId', '==', campaignId)
    .where('verifiedISO', '>=', fromISO)
    .where('verifiedISO', '<=', toISO)
    .where('outcome', '==', 'verified')
    .get();

  const visits = visitsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const totalVV = visits.length;
  const totalPoints = visits.reduce((sum, v) => sum + (v.rewardPoints as number), 0);
  const budgetSpentUsd = totalPoints * DEFAULTS.otPointCostUsd;
  const vvByDay: Record<string, number> = {};
  for (const v of visits) {
    const day = (v.verifiedISO as string).slice(0, 10);
    vvByDay[day] = (vvByDay[day] ?? 0) + 1;
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

export const orbPilotAdminKillSwitch = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const scope = typeof d.scope === 'string' ? d.scope : 'global';
  const targetId = typeof d.targetId === 'string' ? d.targetId : '';
  const kill = Boolean(d.kill);
  const docId = scope === 'global' ? 'global' : `${scope}:${targetId}`;
  await db.collection(C_KILL_SWITCHES).doc(docId).set({ scope, targetId, killed: kill, updatedAt: new Date().toISOString() });
  await auditLog({ action: 'kill_switch', scope, targetId, kill, at: new Date().toISOString() });
  return { success: true, docId, killed: kill };
});

export const orbPilotAdminAudit = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : null;
  const userId = typeof d.userId === 'string' ? d.userId : null;
  const campaignId = typeof d.campaignId === 'string' ? d.campaignId : null;
  const limit = Math.min(Number(d.limit) || 50, 200);

  let query = db.collection(C_ATTEMPTS).limit(limit) as FirebaseFirestore.Query;
  if (partnerId) query = query.where('partnerId', '==', partnerId);
  if (userId) query = query.where('userId', '==', userId);
  if (campaignId) query = query.where('campaignId', '==', campaignId);
  const snap = await query.get();
  const attempts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { success: true, attempts };
});

export const orbPilotAdminUserTrust = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const userId = typeof d.userId === 'string' ? d.userId : '';
  const tier = typeof d.tier === 'string' ? d.tier : 'bronze';
  const reason = typeof d.reason === 'string' ? d.reason : '';
  const now = new Date().toISOString();
  await db.collection(C_TRUST).doc(userId).set({ tier, adminNote: reason, lastUpdatedISO: now, lastEvaluatedISO: now }, { merge: true });
  await auditLog({ action: 'admin_trust_override', userId, tier, reason, at: now });
  return { success: true };
});

export const orbPilotAdminPartnerRisk = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : '';
  const riskProfile = typeof d.riskProfile === 'string' ? d.riskProfile : 'low';
  const forcePinRequired = Boolean(d.forcePinRequired);
  const now = new Date().toISOString();
  await db.collection(C_PARTNERS).doc(partnerId).set({ orbPilotRiskProfile: riskProfile, orbPilotForcePinRequired: forcePinRequired, orbPilotRiskUpdatedAt: now }, { merge: true });
  // Also update all active campaigns for this partner
  const campaignsSnap = await db.collection(C_CAMPAIGNS).where('partnerId', '==', partnerId).where('status', 'in', ['active', 'paused']).get();
  const batch = db.batch();
  campaignsSnap.forEach((doc) => batch.update(doc.ref, { pinRequired: forcePinRequired, updatedAt: now }));
  if (!campaignsSnap.empty) await batch.commit();
  await auditLog({ action: 'admin_partner_risk', partnerId, riskProfile, forcePinRequired, at: now });
  return { success: true };
});

export const orbPilotAdminListCampaigns = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const limit = Math.min(Number(d.limit) || 50, 200);
  const snap = await db.collection(C_CAMPAIGNS).orderBy('updatedAt', 'desc').limit(limit).get();
  return { success: true, campaigns: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

export const orbPilotAdminListTrust = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const tier = typeof d.tier === 'string' ? d.tier : null;
  const limit = Math.min(Number(d.limit) || 50, 200);
  let query = db.collection(C_TRUST).limit(limit) as FirebaseFirestore.Query;
  if (tier) query = query.where('tier', '==', tier);
  const snap = await query.get();
  return { success: true, users: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

export const orbPilotAdminGetConfig = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const cfg = await getConfig();
  return { success: true, config: { ...DEFAULTS, ...cfg } };
});

export const orbPilotAdminUpdateConfig = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const allowed = ['maxWeeklyBudgetUsd', 'globalMaxCpaUsd', 'otPointCostUsd', 'boostFillRateThreshold', 'rescueFillRateThreshold', 'maxPinAttempts', 'claimRadiusMeters', 'verifyRadiusMeters', 'maxAccuracyMeters', 'completeWithinSeconds', 'pinRotationSeconds', 'slotUnclaimedExpirySeconds', 'claimExpirySeconds', 'maxOffersNearby'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (d[key] !== undefined) update[key] = d[key];
  }
  await db.collection(C_CONFIG).doc(CONFIG_DOC).set(update, { merge: true });
  await auditLog({ action: 'admin_config_update', fields: Object.keys(update), at: new Date().toISOString() });
  return { success: true };
});

export const orbPilotAdminEngineLastRun = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const snap = await db.collection(C_ENGINE_RUNS).orderBy('ranAtISO', 'desc').limit(1).get();
  if (snap.empty) return { success: true, run: null };
  return { success: true, run: { id: snap.docs[0].id, ...snap.docs[0].data() } };
});

export const orbPilotPartnerListCampaigns = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };
  const snap = await db.collection(C_CAMPAIGNS).where('partnerId', '==', partnerId).orderBy('updatedAt', 'desc').limit(20).get();
  return { success: true, campaigns: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

export const orbPilotPartnerActivity = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = typeof d.partnerId === 'string' ? d.partnerId : uid;
  const limit = Math.min(Number(d.limit) || 30, 100);
  const pSnap = await db.collection(C_PARTNERS).doc(partnerId).get();
  const p = pSnap.data() as Record<string, unknown>;
  if (p?.ownerUid !== uid && !isAdminCtx(context)) return { success: false, message: 'Not authorized' };
  const snap = await db.collection(C_ATTEMPTS).where('partnerId', '==', partnerId).orderBy('initiatedISO', 'desc').limit(limit).get();
  // Redact userId for privacy
  const attempts = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, userId: (data.userId as string).slice(0, 8) + '…' };
  });
  return { success: true, attempts };
});

export const orbPilotUserHistory = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const limit = Math.min(Number(d.limit) || 20, 100);
  const snap = await db.collection(C_VISITS)
    .where('userId', '==', uid)
    .where('outcome', '==', 'verified')
    .orderBy('verifiedISO', 'desc')
    .limit(limit).get();
  const visits = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { success: true, visits };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 3 — Consent Gates
// ─────────────────────────────────────────────────────────────────────────────

const C_CONSENT = 'orbPilotConsentRecords';

/** Record user consent to OrbPilot verification terms */
export const orbPilotConsentUser = functions.region('us-central1').https.onCall(async (_data, context) => {
  const uid = requireAuth(context);
  const nowISO = new Date().toISOString();
  const existing = await db.collection(C_CONSENT)
    .where('uid', '==', uid)
    .where('consentType', '==', 'verification_terms')
    .limit(1).get();
  if (!existing.empty) return { success: true, alreadyConsented: true };
  await db.collection(C_CONSENT).add({
    uid,
    role: 'user',
    consentType: 'verification_terms',
    acceptedAtISO: nowISO,
    platform: 'mobile',
    appVersion: '1.0',
    createdAt: nowISO,
  });
  return { success: true };
});

/** Record partner consent to OrbPilot partner terms */
export const orbPilotConsentPartner = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  if (!partnerId) throw new functions.https.HttpsError('invalid-argument', 'partnerId required');
  await assertPartnerOwner(partnerId, uid);
  const nowISO = new Date().toISOString();
  const existing = await db.collection(C_CONSENT)
    .where('uid', '==', uid)
    .where('consentType', '==', 'orbpilot_partner_terms')
    .limit(1).get();
  if (!existing.empty) return { success: true, alreadyConsented: true };
  await db.collection(C_CONSENT).add({
    uid,
    role: 'partner',
    consentType: 'orbpilot_partner_terms',
    acceptedAtISO: nowISO,
    platform: 'mobile',
    appVersion: '1.0',
    createdAt: nowISO,
  });
  // Store consent ISO on the campaign if one is active
  await db.collection(C_CAMPAIGNS)
    .where('partnerId', '==', partnerId)
    .limit(10).get()
    .then(async (snap) => {
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { partnerConsentOrbPilotTermsAcceptedAtISO: nowISO });
      });
      await batch.commit();
    });
  return { success: true };
});

/** Check consent status for current user */
export const orbPilotConsentStatus = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = d.partnerId ? String(d.partnerId) : null;
  const userSnap = await db.collection(C_CONSENT)
    .where('uid', '==', uid)
    .where('consentType', '==', 'verification_terms')
    .limit(1).get();
  const userConsent = !userSnap.empty;
  let partnerConsent = false;
  if (partnerId) {
    const pSnap = await db.collection(C_CONSENT)
      .where('uid', '==', uid)
      .where('consentType', '==', 'orbpilot_partner_terms')
      .limit(1).get();
    partnerConsent = !pSnap.empty;
  }
  return { success: true, userConsent, partnerConsent };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 3 — Entitlements
// ─────────────────────────────────────────────────────────────────────────────

const C_USER_RESTRICTIONS = 'orbPilotUserRestrictions';
const C_PARTNER_RESTRICTIONS = 'orbPilotPartnerRestrictions';

/** Helper: get user tier from their profile */
async function getUserTierLevel(uid: string): Promise<'free' | 'premium' | 'pro'> {
  const userDoc = await db.collection('users').doc(uid).get();
  const tier = (userDoc.data() || {}).tier as string | undefined;
  if (tier === 'pro' || tier === 'legendary') return 'pro';
  if (tier === 'premium' || tier === 'gold') return 'premium';
  return 'free';
}

/** Helper: get partner tier */
async function getPartnerTierLevel(partnerId: string): Promise<'free' | 'premium' | 'pro'> {
  const pDoc = await db.collection(C_PARTNERS).doc(partnerId).get();
  const tier = (pDoc.data() || {}).tier as string | undefined;
  if (tier === 'pro' || tier === 'enterprise') return 'pro';
  if (tier === 'premium') return 'premium';
  return 'free';
}

/** Helper: check if user has active restriction */
async function getUserRestriction(uid: string): Promise<string | null> {
  const snap = await db.collection(C_USER_RESTRICTIONS).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const expiresISO = data.expiresISO as string | undefined;
  if (expiresISO && new Date(expiresISO) < new Date()) return null; // expired
  if (data.liftedAt) return null;
  return String(data.type || 'unknown');
}

/** Helper: check if partner has active restriction */
async function getPartnerRestriction(partnerId: string): Promise<string | null> {
  const snap = await db.collection(C_PARTNER_RESTRICTIONS).doc(partnerId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const expiresISO = data.expiresISO as string | undefined;
  if (expiresISO && new Date(expiresISO) < new Date()) return null;
  if (data.liftedAt) return null;
  return String(data.type || 'unknown');
}

/** Get user entitlements for OrbPilot */
export const orbPilotEntitlementsUser = functions.region('us-central1').https.onCall(async (_data, context) => {
  const uid = requireAuth(context);
  const nowISO = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  const [tier, restriction, consentSnap, claimsSnap, vvSnap] = await Promise.all([
    getUserTierLevel(uid),
    getUserRestriction(uid),
    db.collection(C_CONSENT).where('uid', '==', uid).where('consentType', '==', 'verification_terms').limit(1).get(),
    db.collection(C_SLOTS).where('claimUserId', '==', uid).where('status', '==', 'claimed').get(),
    db.collection(C_VISITS).where('userId', '==', uid).where('outcome', '==', 'verified').where('verifiedISO', '>=', weekAgo).get(),
  ]);

  const tierLimits: Record<string, { maxActiveClaims: number; vvPerWeek: number; earlyAccessMinutes: number }> = {
    free:    { maxActiveClaims: 1, vvPerWeek: 3,  earlyAccessMinutes: 0 },
    premium: { maxActiveClaims: 3, vvPerWeek: 6,  earlyAccessMinutes: 5 },
    pro:     { maxActiveClaims: 5, vvPerWeek: 10, earlyAccessMinutes: 10 },
  };
  const limits = tierLimits[tier];
  const activeClaims = claimsSnap.size;
  const vvThisWeek = vvSnap.size;
  const consentGiven = !consentSnap.empty;
  const restricted = !!restriction;

  let canClaim = true;
  let blockReason: string | undefined;
  if (restricted) { canClaim = false; blockReason = `Account restricted: ${restriction}`; }
  else if (!consentGiven) { canClaim = false; blockReason = 'Please accept verification terms first'; }
  else if (activeClaims >= limits.maxActiveClaims) { canClaim = false; blockReason = 'Maximum active claims reached for your tier'; }
  else if (vvThisWeek >= limits.vvPerWeek) { canClaim = false; blockReason = 'Weekly visit limit reached for your tier'; }

  return {
    success: true,
    data: { userId: uid, tier, ...limits, activeClaims, vvThisWeek, canClaim, blockReason, consentGiven, restricted, evaluatedAtISO: nowISO },
  };
});

/** Get partner entitlements for OrbPilot */
export const orbPilotEntitlementsPartner = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  if (!partnerId) throw new functions.https.HttpsError('invalid-argument', 'partnerId required');
  await assertPartnerOwner(partnerId, uid);

  const [tier, restriction, consentSnap, campaignsSnap] = await Promise.all([
    getPartnerTierLevel(partnerId),
    getPartnerRestriction(partnerId),
    db.collection(C_CONSENT).where('uid', '==', uid).where('consentType', '==', 'orbpilot_partner_terms').limit(1).get(),
    db.collection(C_CAMPAIGNS).where('partnerId', '==', partnerId).where('status', '==', 'active').get(),
  ]);

  const tierCaps: Record<string, { engineEnabled: boolean; maxCampaigns: number; advancedControls: boolean; maxDailySlots: number }> = {
    free:    { engineEnabled: false, maxCampaigns: 0, advancedControls: false, maxDailySlots: 0 },
    premium: { engineEnabled: true,  maxCampaigns: 1, advancedControls: false, maxDailySlots: 20 },
    pro:     { engineEnabled: true,  maxCampaigns: 5, advancedControls: true,  maxDailySlots: 100 },
  };
  const caps = tierCaps[tier];
  const activeCampaigns = campaignsSnap.size;
  const consentGiven = !consentSnap.empty;
  const restricted = !!restriction;

  let canCreateCampaign = true;
  let blockReason: string | undefined;
  if (restricted) { canCreateCampaign = false; blockReason = `Partner restricted: ${restriction}`; }
  else if (!caps.engineEnabled) { canCreateCampaign = false; blockReason = 'Upgrade to Premium or Pro to use OrbPilot'; }
  else if (!consentGiven) { canCreateCampaign = false; blockReason = 'Please accept OrbPilot partner terms first'; }
  else if (activeCampaigns >= caps.maxCampaigns) { canCreateCampaign = false; blockReason = 'Campaign limit reached for your tier'; }

  return {
    success: true,
    data: { partnerId, tier, ...caps, activeCampaigns, canCreateCampaign, blockReason, consentGiven, restricted },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 3 — Disputes
// ─────────────────────────────────────────────────────────────────────────────

const C_DISPUTES = 'orbPilotDisputes';
const C_SPEND_LEDGER = 'partnerSpendLedger';

/** Submit a dispute (partner or user) */
export const orbPilotDisputeSubmit = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const visitId = String(d.visitId || '');
  const reason = String(d.reason || '').slice(0, 500);
  const submittedBy = String(d.submittedBy || 'user') as 'partner' | 'user';
  if (!visitId || !reason) throw new functions.https.HttpsError('invalid-argument', 'visitId and reason required');

  const visitDoc = await db.collection(C_VISITS).doc(visitId).get();
  if (!visitDoc.exists) throw new functions.https.HttpsError('not-found', 'Visit not found');
  const visit = visitDoc.data() as Record<string, unknown>;

  // Auth check: user must be visit owner OR partner owner
  if (submittedBy === 'user' && visit.userId !== uid) throw new functions.https.HttpsError('permission-denied', 'Not your visit');
  if (submittedBy === 'partner') await assertPartnerOwner(String(visit.partnerId), uid);

  // Check for existing open dispute
  const existing = await db.collection(C_DISPUTES).where('visitId', '==', visitId).where('status', 'in', ['open', 'under_review']).limit(1).get();
  if (!existing.empty) throw new functions.https.HttpsError('already-exists', 'Dispute already open for this visit');

  const nowISO = new Date().toISOString();
  const ref = await db.collection(C_DISPUTES).add({
    visitId,
    slotId: visit.slotId,
    campaignId: visit.campaignId,
    partnerId: visit.partnerId,
    userId: visit.userId,
    status: 'open',
    reason,
    submittedBy,
    submittedByUid: uid,
    createdAt: nowISO,
    updatedAt: nowISO,
  });
  return { success: true, disputeId: ref.id };
});

/** List disputes for a partner */
export const orbPilotDisputeListPartner = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  const statusFilter = d.status ? String(d.status) : null;
  const limit = Math.min(Number(d.limit) || 20, 100);
  if (!partnerId) throw new functions.https.HttpsError('invalid-argument', 'partnerId required');
  await assertPartnerOwner(partnerId, uid);

  let q: FirebaseFirestore.Query = db.collection(C_DISPUTES).where('partnerId', '==', partnerId);
  if (statusFilter) q = q.where('status', '==', statusFilter);
  q = q.orderBy('createdAt', 'desc').limit(limit);

  const snap = await q.get();
  const disputes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { success: true, disputes };
});

/** List all disputes (admin) */
export const orbPilotDisputeListAdmin = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const statusFilter = d.status ? String(d.status) : null;
  const limit = Math.min(Number(d.limit) || 50, 200);

  let q: FirebaseFirestore.Query = db.collection(C_DISPUTES);
  if (statusFilter) q = q.where('status', '==', statusFilter);
  q = q.orderBy('createdAt', 'desc').limit(limit);

  const snap = await q.get();
  const disputes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { success: true, disputes };
});

/** Approve or deny a dispute (admin) — approve triggers ledger reversal */
export const orbPilotDisputeResolve = functions.region('us-central1').https.onCall(async (data, context) => {
  const adminUid = requireAdmin(context);
  const d = data as Record<string, unknown>;
  const disputeId = String(d.disputeId || '');
  const resolution = String(d.resolution || '') as 'approved' | 'denied';
  const adminNote = String(d.adminNote || '').slice(0, 500);
  if (!disputeId || !['approved', 'denied'].includes(resolution)) {
    throw new functions.https.HttpsError('invalid-argument', 'disputeId and resolution (approved|denied) required');
  }

  const disputeRef = db.collection(C_DISPUTES).doc(disputeId);
  const disputeDoc = await disputeRef.get();
  if (!disputeDoc.exists) throw new functions.https.HttpsError('not-found', 'Dispute not found');
  const dispute = disputeDoc.data() as Record<string, unknown>;
  if (dispute.status !== 'open' && dispute.status !== 'under_review') {
    throw new functions.https.HttpsError('failed-precondition', 'Dispute already resolved');
  }

  const nowISO = new Date().toISOString();
  let reversalTxnId: string | undefined;

  if (resolution === 'approved') {
    // Idempotent ledger reversal
    const visitId = String(dispute.visitId);
    const visitRef = db.collection(C_VISITS).doc(visitId);
    const visitDoc = await visitRef.get();
    const visit = visitDoc.data() as Record<string, unknown>;

    if (visit.rewardGranted && !visit.reversed) {
      const userId = String(visit.userId);
      const rewardPoints = Number(visit.rewardPoints) || 0;
      const idempKey = `reverse:visit:${visitId}`;

      // Check idempotency
      const idempRef = db.collection(C_EARN_IDEMPOTENCY).doc(idempKey);
      const idempDoc = await idempRef.get();

      if (!idempDoc.exists) {
        reversalTxnId = db.collection(C_LEDGERS).doc(userId).collection(C_LEDGER_ENTRIES).doc().id;
        const batch = db.batch();
        // Debit (negative) ledger entry
        batch.set(db.collection(C_LEDGERS).doc(userId).collection(C_LEDGER_ENTRIES).doc(reversalTxnId), {
          type: 'reversal',
          points: -rewardPoints,
          reason: `OrbPilot dispute reversal: ${disputeId}`,
          refId: visitId,
          createdAt: nowISO,
        });
        // Mark idempotency
        batch.set(idempRef, { reversalTxnId, resolvedAt: nowISO });
        // Update visit
        batch.update(visitRef, { reversed: true, reversalLedgerTxnId: reversalTxnId, disputeStatus: 'reversed', disputeClosedISO: nowISO });
        // Update dispute
        batch.update(disputeRef, {
          status: 'reversed',
          adminNote,
          resolvedByUid: adminUid,
          resolvedAtISO: nowISO,
          updatedAt: nowISO,
          ledgerReversed: true,
          reversalLedgerTxnId: reversalTxnId,
        });
        // Credit partner spend ledger
        const partnerId = String(visit.partnerId);
        const monthKey = nowISO.slice(0, 7);
        batch.set(db.collection(C_SPEND_LEDGER).doc(), {
          partnerId,
          campaignId: visit.campaignId,
          visitId,
          disputeId,
          type: 'credit',
          amountUsd: (rewardPoints * 0.01),
          rewardPoints,
          monthKey,
          createdAt: nowISO,
          note: `Dispute reversal approved by admin`,
        });
        await batch.commit();
      } else {
        reversalTxnId = (idempDoc.data() || {}).reversalTxnId as string;
      }
    } else {
      // No reward to reverse — just close
      await disputeRef.update({ status: 'approved', adminNote, resolvedByUid: adminUid, resolvedAtISO: nowISO, updatedAt: nowISO });
      await db.collection(C_VISITS).doc(visitId).update({ disputeStatus: 'approved', disputeClosedISO: nowISO });
    }
  } else {
    // Denied
    const visitId = String(dispute.visitId);
    await disputeRef.update({ status: 'denied', adminNote, resolvedByUid: adminUid, resolvedAtISO: nowISO, updatedAt: nowISO });
    await db.collection(C_VISITS).doc(visitId).update({ disputeStatus: 'denied', disputeClosedISO: nowISO });
  }

  return { success: true, resolution, reversalLedgerTxnId: reversalTxnId };
});

/** Mark dispute as under_review (admin) */
export const orbPilotDisputeReview = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const disputeId = String(d.disputeId || '');
  if (!disputeId) throw new functions.https.HttpsError('invalid-argument', 'disputeId required');
  await db.collection(C_DISPUTES).doc(disputeId).update({ status: 'under_review', updatedAt: new Date().toISOString() });
  return { success: true };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 3 — User/Partner Restrictions (Rate Limiting + Temp Bans)
// ─────────────────────────────────────────────────────────────────────────────

/** Set or update user restriction (admin only) */
export const orbPilotRestrictUser = functions.region('us-central1').https.onCall(async (data, context) => {
  const adminUid = requireAdmin(context);
  const d = data as Record<string, unknown>;
  const userId = String(d.userId || '');
  const type = String(d.type || 'temporary_ban');
  const reason = String(d.reason || '').slice(0, 300);
  const expiresISO = d.expiresISO ? String(d.expiresISO) : undefined;
  if (!userId || !reason) throw new functions.https.HttpsError('invalid-argument', 'userId and reason required');
  const nowISO = new Date().toISOString();
  await db.collection(C_USER_RESTRICTIONS).doc(userId).set({
    userId, type, reason, expiresISO: expiresISO || null,
    createdByUid: adminUid, createdAt: nowISO, liftedAt: null,
  }, { merge: false });
  return { success: true };
});

/** Lift user restriction (admin only) */
export const orbPilotLiftUserRestriction = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const userId = String(d.userId || '');
  if (!userId) throw new functions.https.HttpsError('invalid-argument', 'userId required');
  await db.collection(C_USER_RESTRICTIONS).doc(userId).update({ liftedAt: new Date().toISOString() });
  return { success: true };
});

/** Set or update partner restriction (admin only) */
export const orbPilotRestrictPartner = functions.region('us-central1').https.onCall(async (data, context) => {
  const adminUid = requireAdmin(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  const type = String(d.type || 'pilot_suspend');
  const reason = String(d.reason || '').slice(0, 300);
  const expiresISO = d.expiresISO ? String(d.expiresISO) : undefined;
  if (!partnerId || !reason) throw new functions.https.HttpsError('invalid-argument', 'partnerId and reason required');
  const nowISO = new Date().toISOString();
  await db.collection(C_PARTNER_RESTRICTIONS).doc(partnerId).set({
    partnerId, type, reason, expiresISO: expiresISO || null,
    createdByUid: adminUid, createdAt: nowISO, liftedAt: null,
  }, { merge: false });
  return { success: true };
});

/** Lift partner restriction (admin only) */
export const orbPilotLiftPartnerRestriction = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  if (!partnerId) throw new functions.https.HttpsError('invalid-argument', 'partnerId required');
  await db.collection(C_PARTNER_RESTRICTIONS).doc(partnerId).update({ liftedAt: new Date().toISOString() });
  return { success: true };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 2 — Partner Spend Ledger Queries
// ─────────────────────────────────────────────────────────────────────────────

/** Get partner spend ledger for a month */
export const orbPilotSpendLedger = functions.region('us-central1').https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const d = data as Record<string, unknown>;
  const partnerId = String(d.partnerId || '');
  const monthKey = String(d.monthKey || new Date().toISOString().slice(0, 7));
  if (!partnerId) throw new functions.https.HttpsError('invalid-argument', 'partnerId required');
  await assertPartnerOwner(partnerId, uid);

  const snap = await db.collection(C_SPEND_LEDGER)
    .where('partnerId', '==', partnerId)
    .where('monthKey', '==', monthKey)
    .orderBy('createdAt', 'desc')
    .limit(200).get();

  const entries = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const totalDebits = entries.filter((e: Record<string, unknown>) => e.type === 'debit').reduce((s: number, e: Record<string, unknown>) => s + (Number(e.amountUsd) || 0), 0);
  const totalCredits = entries.filter((e: Record<string, unknown>) => e.type === 'credit').reduce((s: number, e: Record<string, unknown>) => s + (Number(e.amountUsd) || 0), 0);
  const netUsd = totalDebits - totalCredits;

  return { success: true, entries, totalDebits, totalCredits, netUsd, monthKey };
});

// ─────────────────────────────────────────────────────────────────────────────
// APPENDIX 2 — Admin System Health + Abuse Monitor
// ─────────────────────────────────────────────────────────────────────────────

/** System health dashboard data (admin) */
export const orbPilotAdminHealth = functions.region('us-central1').https.onCall(async (_data, context) => {
  requireAdmin(context);
  const nowISO = new Date().toISOString();
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  const [
    activeCampaigns,
    recentVV,
    recentAttempts,
    openDisputes,
    lastTickSnap,
    killSwitchSnap,
  ] = await Promise.all([
    db.collection(C_CAMPAIGNS).where('status', '==', 'active').get(),
    db.collection(C_VISITS).where('outcome', '==', 'verified').where('verifiedISO', '>=', oneDayAgo).get(),
    db.collection(C_ATTEMPTS).where('createdAt', '>=', oneDayAgo).get(),
    db.collection(C_DISPUTES).where('status', 'in', ['open', 'under_review']).get(),
    db.collection(C_ENGINE_RUNS).orderBy('ranAtISO', 'desc').limit(1).get(),
    db.collection(C_KILL_SWITCHES).get(),
  ]);

  const vv24h = recentVV.size;
  const attempts24h = recentAttempts.size;
  const failedAttempts = recentAttempts.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    return data.outcome === 'rejected';
  }).length;
  const failureRate24h = attempts24h > 0 ? Math.round((failedAttempts / attempts24h) * 100) : 0;

  const lastTick = lastTickSnap.empty ? null : { id: lastTickSnap.docs[0].id, ...lastTickSnap.docs[0].data() };
  const globalKill = killSwitchSnap.docs.some((d) => {
    const data = d.data() as Record<string, unknown>;
    return d.id === 'global' && data.killed === true;
  });

  return {
    success: true,
    evaluatedAtISO: nowISO,
    activeCampaigns: activeCampaigns.size,
    vv24h,
    failureRate24h,
    openDisputes: openDisputes.size,
    engineLastRun: lastTick,
    globalKillActive: globalKill,
    activeKillSwitches: killSwitchSnap.size,
  };
});

/** Abuse monitor: users with high rejection rates or brute force flags (admin) */
export const orbPilotAdminAbuse = functions.region('us-central1').https.onCall(async (data, context) => {
  requireAdmin(context);
  const d = data as Record<string, unknown>;
  const limit = Math.min(Number(d.limit) || 50, 200);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [bruteForceSnap, highRejectionSnap, restrictedSnap] = await Promise.all([
    db.collection(C_ATTEMPTS).where('pinBruteForceFlagged', '==', true).where('createdAt', '>=', sevenDaysAgo).orderBy('createdAt', 'desc').limit(limit).get(),
    db.collection(C_TRUST).where('rejections30d', '>=', 5).orderBy('rejections30d', 'desc').limit(limit).get(),
    db.collection(C_USER_RESTRICTIONS).orderBy('createdAt', 'desc').limit(limit).get(),
  ]);

  const bruteForceFlags = bruteForceSnap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return { id: doc.id, userId: (data.userId as string).slice(0, 8) + '…', ...data };
  });
  const highRejection = highRejectionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const restricted = restrictedSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return { success: true, bruteForceFlags, highRejection, restricted };
});
