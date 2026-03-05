/**
 * OrbPass™ — Cloud Functions: config, eligible offers, redemption flow, admin.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

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

type RedemptionStatus = 'initiated' | 'locked' | 'verified' | 'completed' | 'cancelled' | 'disputed' | 'reversed';

interface OrbPassConfig {
  enabled: boolean;
  citiesEnabled?: string[];
  tiersEnabled: { free: boolean; premium: boolean; pro: boolean };
  capsByTier: Record<string, { redemptionsPerMonth: number; maxValuePerMonth: number; cooldownHours: number }>;
  categoryCapsByTier: Record<string, Record<string, number>>;
  partnerRules: { maxValuePerRedemption: number; minPartnerTrustScore: number; requireVerification: boolean; disputeWindowHours: number };
  antiFraud: { maxRedemptionsPerDay: number; velocityWindowMinutes: number; velocityMaxActions: number; deviceBindingRequired: boolean };
  settlement: { payoutMode: string; monthlyPoolAmount: number; payoutWeights: Record<string, number>; holdbackPercent: number };
  emergencyKill: { disableDiscovery: boolean; disableRedemption: boolean; disableSettlement: boolean };
}

const DEFAULT_CONFIG: OrbPassConfig = {
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

async function getConfig(): Promise<OrbPassConfig> {
  const snap = await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).get();
  if (!snap.exists) return DEFAULT_CONFIG;
  const d = snap.data() as Record<string, unknown>;
  return {
    enabled: d?.enabled === true,
    citiesEnabled: Array.isArray(d?.citiesEnabled) ? d.citiesEnabled as string[] : DEFAULT_CONFIG.citiesEnabled,
    tiersEnabled: { ...DEFAULT_CONFIG.tiersEnabled, ...(d?.tiersEnabled as object) },
    capsByTier: { ...DEFAULT_CONFIG.capsByTier, ...(d?.capsByTier as object) },
    categoryCapsByTier: { ...DEFAULT_CONFIG.categoryCapsByTier, ...(d?.categoryCapsByTier as object) },
    partnerRules: { ...DEFAULT_CONFIG.partnerRules, ...(d?.partnerRules as object) },
    antiFraud: { ...DEFAULT_CONFIG.antiFraud, ...(d?.antiFraud as object) },
    settlement: { ...DEFAULT_CONFIG.settlement, ...(d?.settlement as object) },
    emergencyKill: { ...DEFAULT_CONFIG.emergencyKill, ...(d?.emergencyKill as object) },
  };
}

function getUserTier(context: functions.https.CallableContext): 'free' | 'premium' | 'pro' {
  const token = context.auth?.token as Record<string, unknown> | undefined;
  if (token?.premium === true) return 'premium';
  if (token?.pro === true || token?.partner === true) return 'pro';
  return 'free';
}

async function isPartner(uid: string): Promise<boolean> {
  const snap = await db.collection(PARTNERS).doc(uid).get();
  return snap.exists;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ahoddd@icloud.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdminContext(context: functions.https.CallableContext): boolean {
  if (!context.auth) return false;
  const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
  return ADMIN_EMAILS.includes(email);
}

async function recordEvent(type: string, metadata: Record<string, unknown>): Promise<void> {
  await db.collection(EVENTS).add({
    ts: FieldValue.serverTimestamp(),
    type,
    userUid: metadata.userUid ?? null,
    partnerId: metadata.partnerId ?? null,
    redemptionId: metadata.redemptionId ?? null,
    metadata,
  });
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Get config + eligibility for current user. */
export const orbPassGetConfig = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    const tier = getUserTier(context);
    const tierEnabled = config.tiersEnabled[tier as keyof typeof config.tiersEnabled] === true;
    const eligible = config.enabled && tierEnabled && !config.emergencyKill.disableDiscovery;
    const caps = config.capsByTier[tier] ?? config.capsByTier.free;
    return {
      success: true,
      config: { enabled: config.enabled, emergencyKill: config.emergencyKill, capsByTier: config.capsByTier },
      userTier: tier,
      eligible,
      caps: eligible ? caps : null,
    };
  });

/** List eligible offers (partners with orbPass enabled, filtered by city/tier). */
export const orbPassEligibleOffers = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const config = await getConfig();
    if (!config.enabled || config.emergencyKill.disableDiscovery) return { success: true, offers: [] };
    const tier = getUserTier(context);
    if (!config.tiersEnabled[tier as keyof typeof config.tiersEnabled]) return { success: true, offers: [] };

    const d = data as Record<string, unknown> | null | undefined;
    const cityId = typeof d?.cityId === 'string' ? d.cityId.trim() : 'default';
    if (config.citiesEnabled && config.citiesEnabled.length > 0 && !config.citiesEnabled.includes(cityId)) return { success: true, offers: [] };

    const partnersSnap = await db.collection(PARTNERS).limit(100).get();
    const offers: any[] = [];
    for (const doc of partnersSnap.docs) {
      const partnerId = doc.id;
      const setSnap = await db.collection(PARTNERS).doc(partnerId).collection(ORB_PASS_SETTINGS).doc('default').get();
      if (!setSnap.exists) continue;
      const s = setSnap.data()!;
      if (s.enabled !== true) continue;
      const cities: string[] = s.citiesEnabled ?? [];
      if (cities.length > 0 && !cities.includes(cityId)) continue;
      const templates = Array.isArray(s.offerTemplates) ? s.offerTemplates : [];
      const partnerName = (doc.data()?.name as string) ?? partnerId;
      templates.forEach((t: any, i: number) => {
        offers.push({
          offerId: `${partnerId}_${i}`,
          partnerId,
          partnerName,
          title: t.title ?? 'OrbPass offer',
          description: t.description ?? '',
          valueCents: typeof t.valueCents === 'number' ? t.valueCents : 0,
          redemptionRules: t.redemptionRules ?? '',
          cooldownHours: s.redemptionConstraints?.cooldownHours ?? 24,
          minSpendCents: s.redemptionConstraints?.minSpendCents ?? null,
        });
      });
    }
    return { success: true, offers };
  });

/** Initiate redemption: create redemption doc, issue PIN/QR. */
export const orbPassRedemptionInitiate = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled) return { success: false, message: 'OrbPass is not enabled.' };
    if (config.emergencyKill.disableRedemption) return { success: false, message: 'Redemption is temporarily disabled.' };

    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const offerTemplateId = typeof d?.offerTemplateId === 'string' ? d.offerTemplateId : null;
    const valueCents = Math.max(0, Math.min(config.partnerRules.maxValuePerRedemption, Number(d?.valueCents) || 0));
    const cityId = typeof d?.cityId === 'string' ? d.cityId.trim() : 'default';
    if (!partnerId || valueCents <= 0) return { success: false, message: 'partnerId and valueCents required.' };

    const tier = getUserTier(context);
    if (!config.tiersEnabled[tier as keyof typeof config.tiersEnabled]) return { success: false, message: 'OrbPass not available for your tier.' };

    const caps = config.capsByTier[tier] ?? config.capsByTier.free;
    const now = Date.now();
    const key = monthKey(now);
    const userMonthRef = db.collection(USER_MONTH).doc(`${uid}_${key}`);
    const userMonthSnap = await userMonthRef.get();
    const userMonth = userMonthSnap.data() || { redemptions: 0, valueCents: 0 };
    if (userMonth.redemptions >= caps.redemptionsPerMonth) return { success: false, message: 'Monthly redemption cap reached.' };
    if (userMonth.valueCents + valueCents > caps.maxValuePerMonth) return { success: false, message: 'Monthly value cap would be exceeded.' };

    const velocityRef = db.collection(VELOCITY).doc(uid);
    const velSnap = await velocityRef.get();
    const windowMs = config.antiFraud.velocityWindowMinutes * 60 * 1000;
    const since = now - windowMs;
    const timestamps: number[] = (velSnap.data()?.timestamps as number[]) || [];
    const recent = timestamps.filter((t) => t > since);
    if (recent.length >= config.antiFraud.velocityMaxActions) return { success: false, message: 'Too many actions; try again later.' };

    const partnerSettingsSnap = await db.collection(PARTNERS).doc(partnerId).collection(ORB_PASS_SETTINGS).doc('default').get();
    if (!partnerSettingsSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerSettings = partnerSettingsSnap.data()!;
    if (partnerSettings.enabled !== true) return { success: false, message: 'Partner OrbPass is not enabled.' };

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
      status: 'initiated' as RedemptionStatus,
      verification: { method: null as 'pin' | 'qr' | null, pin, qrToken, verifiedAt: null, verifiedByPartnerId: null },
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
    return { success: true, redemptionId: redemptionRef.id, pin, qrToken, redemption: { ...redemption } };
  });

/** Partner: verify PIN/QR (transaction). */
export const orbPassRedemptionVerify = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const isPartnerUser = await isPartner(uid);
    if (!isPartnerUser) return { success: false, message: 'Only the partner can verify.' };

    const d = data as Record<string, unknown> | null | undefined;
    const redemptionId = typeof d?.redemptionId === 'string' ? d.redemptionId.trim() : '';
    const pinOrToken = typeof d?.pin === 'string' ? d.pin.trim() : (typeof d?.qrToken === 'string' ? d.qrToken.trim() : '');
    if (!redemptionId || !pinOrToken) return { success: false, message: 'redemptionId and pin or qrToken required.' };

    const ref = db.collection(REDEMPTIONS).doc(redemptionId);
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { success: false, message: 'Redemption not found.' };
      const r = snap.data()!;
      if (r.partnerId !== uid) return { success: false, message: 'Not your redemption.' };
      if (r.status !== 'initiated') return { success: false, message: 'Already verified or completed.' };
      const v = r.verification || {};
      if (v.pin !== pinOrToken && v.qrToken !== pinOrToken) return { success: false, message: 'Invalid PIN or QR code.' };
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
export const orbPassRedemptionComplete = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;

    const d = data as Record<string, unknown> | null | undefined;
    const redemptionId = typeof d?.redemptionId === 'string' ? d.redemptionId.trim() : '';
    if (!redemptionId) return { success: false, message: 'redemptionId required.' };

    const config = await getConfig();
    const ref = db.collection(REDEMPTIONS).doc(redemptionId);

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { success: false, message: 'Redemption not found.' };
      const r = snap.data()!;
      if (r.userUid !== uid) return { success: false, message: 'Not your redemption.' };
      if (r.status !== 'verified') return { success: false, message: 'Redemption must be verified first.' };

      const now = Date.now();
      tx.update(ref, { status: 'completed' });

      const amountCents = Math.round((r.valueCents ?? 0) * (1 - (config.settlement.holdbackPercent ?? 0) / 100));
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
export const orbPassRedemptionHistory = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const config = await getConfig();
    if (!config.enabled) return { success: true, redemptions: [] };
    const d = data as Record<string, unknown> | null | undefined;
    const limit = Math.min(50, Math.max(1, Number(d?.limit) || 20));
    const snap = await db.collection(REDEMPTIONS).where('userUid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get();
    const redemptions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, redemptions };
  });

/** Partner inbox: pending/locked/verified redemptions. */
export const orbPassPartnerInbox = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    if (!(await isPartner(uid))) return { success: false, message: 'Partners only.' };
    const config = await getConfig();
    if (!config.enabled) return { success: true, redemptions: [] };
    const d = data as Record<string, unknown> | null | undefined;
    const status = typeof d?.status === 'string' ? d.status : undefined;
    const limit = Math.min(50, Math.max(1, Number(d?.limit) || 20));
    let q = db.collection(REDEMPTIONS).where('partnerId', '==', uid).orderBy('createdAt', 'desc').limit(limit);
    if (status) q = q.where('status', '==', status) as admin.firestore.Query;
    const snap = await q.get();
    const redemptions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, redemptions };
  });

/** Partner update OrbPass settings. */
export const orbPassPartnerUpdateSettings = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    if (!(await isPartner(uid))) return { success: false, message: 'Partners only.' };
    const d = data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== 'object') return { success: false, message: 'Payload required.' };
    const ref = db.collection(PARTNERS).doc(uid).collection(ORB_PASS_SETTINGS).doc('default');
    await ref.set(d, { merge: true });
    return { success: true };
  });

/** Admin: metrics. */
export const adminOrbPassMetrics = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const config = await getConfig();
    const redSnap = await db.collection(REDEMPTIONS).limit(500).get();
    let initiated = 0, verified = 0, completed = 0, cancelled = 0;
    redSnap.docs.forEach((doc) => {
      const s = doc.data().status;
      if (s === 'initiated') initiated++;
      else if (s === 'verified') verified++;
      else if (s === 'completed') completed++;
      else if (s === 'cancelled') cancelled++;
    });
    return {
      success: true,
      configEnabled: config.enabled,
      emergencyKill: config.emergencyKill,
      redemptions: { initiated, verified, completed, cancelled, total: redSnap.size },
    };
  });

/** Admin: update config. */
export const adminOrbPassUpdateConfig = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== 'object') return { success: false, message: 'Payload required.' };
    await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).set(d, { merge: true });
    return { success: true };
  });

/** Admin: run settlement for month (idempotent: only creates ledger entries for completed redemptions that don't have one yet). */
export const adminOrbPassSettlementRunMonth = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const config = await getConfig();
    if (config.emergencyKill.disableSettlement) return { success: false, message: 'Settlement is disabled.' };
    const d = data as Record<string, unknown> | null | undefined;
    const monthKeyParam = typeof d?.monthKey === 'string' ? d.monthKey.trim() : monthKey(Date.now());

    const completedSnap = await db.collection(REDEMPTIONS).where('status', '==', 'completed').get();
    const existingLedgerSnap = await db.collection(LEDGER).where('monthKey', '==', monthKeyParam).limit(500).get();
    const existingRedemptionIds = new Set(existingLedgerSnap.docs.map((doc) => doc.data().redemptionId).filter(Boolean));

    const batch = db.batch();
    let added = 0;
    completedSnap.docs.forEach((doc) => {
      const r = doc.data();
      const createdAt = r.createdAt ?? 0;
      if (monthKey(createdAt) !== monthKeyParam) return;
      if (existingRedemptionIds.has(doc.id)) return;
      const pid = r.partnerId;
      if (!pid) return;
      const amountCents = Math.round((r.valueCents ?? 0) * (1 - (config.settlement.holdbackPercent ?? 0) / 100));
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
export const adminOrbPassEmergencyKill = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const kill = d?.emergencyKill as Record<string, boolean> | undefined;
    if (!kill || typeof kill !== 'object') return { success: false, message: 'emergencyKill object required.' };
    await db.collection(ORBTAP_CONFIG).doc(ORB_PASS_DOC).set({ emergencyKill: kill }, { merge: true });
    return { success: true };
  });
