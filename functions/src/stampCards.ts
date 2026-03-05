/**
 * Stamp Cards™ — Cloud Functions: earn stamp, redeem reward, programs CRUD.
 * Server-authoritative; idempotent; rate-limited.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const STAMP_PROGRAMS = 'stampPrograms';
const STAMP_CARD_STATE = 'stampCardState';
const STAMP_EVENTS = 'stampEvents';
const STAMP_IDEMPOTENCY = 'stampIdempotency';
const VERIFIED_ACTIONS = 'verifiedActions';
const LEDGERS = 'ledgers';
const RATE_LIMIT_STAMP = 'rateLimitStamp';
const PARTNERS = 'partners';

/** OT points for stamp card completion and OT bonus reward type (align with index EMISSION_RATES). */
const STAMP_COMPLETE_BONUS_POINTS = 25;
const STAMP_OT_BONUS_POINTS = 50;

/** Demo partner id used when admin tests as partner (no Firestore doc required). */
const DEMO_PARTNER_ID = 'orbtap-universe';

const ADMIN_EMAILS: string[] = ['ahoddd@icloud.com'];

function isAdminContext(context: functions.https.CallableContext): boolean {
  if (!context.auth) return false;
  const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === email);
}

function resolvePartnerId(data: Record<string, unknown> | null | undefined, authUid: string, isAdmin: boolean): string {
  const requested = typeof data?.partnerId === 'string' ? data.partnerId.trim() : '';
  if (requested && (requested === authUid || isAdmin)) return requested;
  return authUid;
}

const COOLDOWN_MS_PER_HOUR = 60 * 60 * 1000;
const RATE_LIMIT_STAMP_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_STAMP_MAX = 30;

function safeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

async function checkRateLimit(collection: string, docId: string, windowMs: number, maxCount: number): Promise<void> {
  const ref = db.collection(collection).doc(docId);
  const snap = await ref.get();
  const data = snap.data();
  const timestamps: number[] = Array.isArray(data?.timestamps) ? data.timestamps : [];
  const now = Date.now();
  const recent = timestamps.filter((t) => t > now - windowMs);
  if (recent.length >= maxCount) throw new Error('Rate limit exceeded. Try again later.');
  recent.push(now);
  await ref.set({ timestamps: recent.slice(-maxCount * 2) }, { merge: true });
}

function getCooldownWindowStart(now: number, cooldownHours: number): number {
  const windowMs = cooldownHours * COOLDOWN_MS_PER_HOUR;
  return Math.floor(now / windowMs) * windowMs;
}

/** Earn one stamp. Idempotent per (uid, programId) within cooldown window. */
export const stampCardsEarnStamp = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const programId = typeof d?.programId === 'string' ? d.programId.trim() : '';
    const tokenId = typeof d?.tokenId === 'string' ? d.tokenId.trim() : null;

    if (!partnerId || !programId) return { success: false, message: 'partnerId and programId required.' };

    try {
      await checkRateLimit(RATE_LIMIT_STAMP, `uid_${safeId(uid)}`, RATE_LIMIT_STAMP_WINDOW_MS, RATE_LIMIT_STAMP_MAX);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const programRef = db.collection(STAMP_PROGRAMS).doc(programId);
    const programSnap = await programRef.get();
    if (!programSnap.exists) return { success: false, message: 'Program not found.' };
    const program = programSnap.data()!;
    if (program.partnerId !== partnerId) return { success: false, message: 'Program does not belong to this partner.' };
    if (program.status !== 'ACTIVE') return { success: false, message: 'Program is not active.' };

    const cooldownHours = typeof program.cooldownHours === 'number' ? program.cooldownHours : 24;
    const stampsRequired = typeof program.stampsRequired === 'number' ? program.stampsRequired : 10;
    const now = Date.now();
    const idemKey = tokenId
      ? safeId(`${uid}_${programId}_${tokenId}`)
      : safeId(`${uid}_${programId}_${getCooldownWindowStart(now, cooldownHours)}`);
    const idemRef = db.collection(STAMP_IDEMPOTENCY).doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const existing = idemSnap.data();
      return {
        success: true,
        idempotent: true,
        stampCount: existing?.stampCount,
        rewardEarned: existing?.rewardEarned === true,
        nextEligibleAt: existing?.nextEligibleAt,
        actionId: existing?.actionId,
      };
    }

    const stateId = `${uid}_${programId}`;
    const stateRef = db.collection(STAMP_CARD_STATE).doc(stateId);
    let stateSnap = await stateRef.get();
    let state: {
      stampCount: number;
      lastStampAt: number | null;
      completedCount: number;
      activeReward: admin.firestore.DocumentData | null;
      updatedAt: number;
    };
    if (!stateSnap.exists) {
      state = {
        stampCount: 0,
        lastStampAt: null,
        completedCount: 0,
        activeReward: null,
        updatedAt: now,
      };
    } else {
      const s = stateSnap.data()!;
      state = {
        stampCount: typeof s.stampCount === 'number' ? s.stampCount : 0,
        lastStampAt: typeof s.lastStampAt === 'number' ? s.lastStampAt : null,
        completedCount: typeof s.completedCount === 'number' ? s.completedCount : 0,
        activeReward: s.activeReward && typeof s.activeReward === 'object' ? s.activeReward : null,
        updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : now,
      };
    }

    const windowStart = getCooldownWindowStart(now, cooldownHours);
    if (state.lastStampAt != null && state.lastStampAt >= windowStart) {
      const nextEligibleAt = windowStart + cooldownHours * COOLDOWN_MS_PER_HOUR;
      return {
        success: false,
        message: `Next stamp available in ${Math.ceil((nextEligibleAt - now) / (60 * 60 * 1000))} hours`,
        nextEligibleAt,
      };
    }

    const caps = program.caps && typeof program.caps === 'object' ? program.caps : {};
    const maxStampsPerUserPerDay = typeof caps.maxStampsPerUserPerDay === 'number' ? caps.maxStampsPerUserPerDay : 1;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayKey = todayStart.getTime();
    const dayIdemKey = safeId(`${uid}_${programId}_day_${todayKey}`);
    const dayIdemRef = db.collection(STAMP_IDEMPOTENCY).doc(dayIdemKey);
    const daySnap = await dayIdemRef.get();
    let stampsToday = 0;
    if (daySnap.exists) stampsToday = (daySnap.data()?.count as number) ?? 0;
    if (stampsToday >= maxStampsPerUserPerDay) {
      return { success: false, message: 'Daily stamp limit reached for this program.' };
    }

    const reward = program.reward && typeof program.reward === 'object' ? program.reward : {};
    const rewardLabel = typeof reward.label === 'string' ? reward.label : 'Reward';
    const expiresHours = reward.expiresHoursAfterEarn != null ? reward.expiresHoursAfterEarn : null;
    const boostWindows = Array.isArray(program.boostWindows) ? program.boostWindows : [];
    const nowDate = new Date(now);
    const utcHour = nowDate.getUTCHours();
    const inBoostWindow = boostWindows.some(
      (w: { startHour?: number; endHour?: number }) =>
        typeof w.startHour === 'number' && typeof w.endHour === 'number' &&
        utcHour >= w.startHour && utcHour < w.endHour
    );
    const stampsToAdd = inBoostWindow ? 2 : 1;
    let newStampCount = state.stampCount + stampsToAdd;
    let newCompletedCount = state.completedCount;
    let newActiveReward: admin.firestore.DocumentData | null = state.activeReward;
    const justEarnedReward = newStampCount >= stampsRequired;

    if (justEarnedReward) {
      newCompletedCount += 1;
      newActiveReward = {
        status: 'EARNED',
        earnedAt: now,
        expiresAt: expiresHours != null ? now + expiresHours * 60 * 60 * 1000 : null,
        redeemedAt: null,
        rewardLabel,
        programId,
        partnerId,
      };
      newStampCount = 0;
    }

    const actionId = `va_stamp_${Date.now()}_${uid.slice(0, 8)}`;
    const rewardType = reward && typeof (reward as { type?: string }).type === 'string' ? (reward as { type: string }).type : '';
    const completeBonus = justEarnedReward ? STAMP_COMPLETE_BONUS_POINTS : 0;
    const otBonus = justEarnedReward && rewardType === 'OT_POINTS_BONUS' ? STAMP_OT_BONUS_POINTS : 0;
    const pointsToAward = completeBonus + otBonus;

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(stateRef, {
        uid,
        programId,
        partnerId,
        stampCount: newStampCount,
        lastStampAt: now,
        completedCount: newCompletedCount,
        activeReward: newActiveReward,
        updatedAt: now,
      });
      tx.set(idemRef, {
        stampCount: newStampCount,
        rewardEarned: justEarnedReward,
        nextEligibleAt: windowStart + cooldownHours * COOLDOWN_MS_PER_HOUR,
        actionId,
        createdAt: now,
      });
      tx.set(dayIdemRef, { count: stampsToday + 1 }, { merge: true });
      tx.set(db.collection(STAMP_EVENTS).doc(), {
        uid,
        programId,
        partnerId,
        eventType: 'STAMP_EARNED',
        createdAt: now,
        meta: { stampCount: newStampCount, completed: justEarnedReward },
      });
      tx.set(db.collection(VERIFIED_ACTIONS).doc(actionId), {
        id: actionId,
        uid,
        partnerId,
        perkId: programId,
        refType: 'stamp',
        refId: programId,
        reasonCode: justEarnedReward ? 'EMIT_STAMP_CARD_COMPLETE_BONUS' : 'EMIT_STAMP_EARNED',
        pointsAwarded: pointsToAward,
        createdAt: now,
        actionType: justEarnedReward ? 'STAMP_REWARD_EARNED' : 'STAMP_EARNED',
      });
      if (pointsToAward > 0) {
        const ledgerRef = db.collection(LEDGERS).doc(uid);
        const ledgerSnap = await tx.get(ledgerRef);
        const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
        const newBalance = currentBalance + pointsToAward;
        tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
        if (completeBonus > 0) {
          tx.set(ledgerRef.collection('entries').doc(), {
            type: 'earn',
            amount: completeBonus,
            reason: 'EMIT_STAMP_CARD_COMPLETE_BONUS',
            ref: { actionId, partnerId, perkId: programId },
            createdAt: now,
          });
        }
        if (otBonus > 0) {
          tx.set(ledgerRef.collection('entries').doc(), {
            type: 'earn',
            amount: otBonus,
            reason: 'EMIT_STAMP_CARD_OT_BONUS',
            ref: { actionId, partnerId, perkId: programId },
            createdAt: now,
          });
        }
      }
    });

    return {
      success: true,
      stampCount: newStampCount,
      rewardEarned: justEarnedReward,
      nextEligibleAt: windowStart + cooldownHours * COOLDOWN_MS_PER_HOUR,
      actionId,
      activeReward: justEarnedReward ? newActiveReward : null,
    };
  });

/** Redeem stamp reward. Partner or staff scans user's reward token / PIN. Idempotent. */
export const stampCardsRedeemReward = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const staffUid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const rewardToken = typeof d?.rewardToken === 'string' ? d.rewardToken.trim() : '';
    const pin = typeof d?.pin === 'string' ? d.pin.trim() : '';

    if (!rewardToken && !pin) return { success: false, message: 'rewardToken or pin required.' };

    // Resolve token/pin to (uid, programId) - for V1 we use stateId as token: base64(uid_programId) or a generated token stored in a collection
    const stateId = rewardToken || pin;
    const stateRef = db.collection(STAMP_CARD_STATE).doc(stateId);
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) return { success: false, message: 'Invalid reward code.' };
    const state = stateSnap.data()!;
    const uid = state.uid as string;
    const programId = state.programId as string;
    const partnerId = state.partnerId as string;
    const activeReward = state.activeReward as { status: string; earnedAt: number } | null;
    if (!activeReward || activeReward.status !== 'EARNED') {
      return { success: false, message: 'No reward to redeem or already redeemed.' };
    }

    const programRef = db.collection(STAMP_PROGRAMS).doc(programId);
    const programSnap = await programRef.get();
    if (!programSnap.exists) return { success: false, message: 'Program not found.' };
    const program = programSnap.data()!;
    if (program.partnerId !== partnerId) return { success: false, message: 'Program mismatch.' };
    const isPartner = staffUid === partnerId;
    if (!isPartner) {
      return { success: false, message: 'Only the partner can redeem this reward.' };
    }

    const now = Date.now();
    const idemKey = safeId(`redeem_${uid}_${programId}_${activeReward.earnedAt}`);
    const idemRef = db.collection(STAMP_IDEMPOTENCY).doc(idemKey);
    if ((await idemRef.get()).exists) {
      return { success: true, idempotent: true, message: 'Already redeemed.' };
    }

    const actionId = `va_stamp_r_${Date.now()}_${uid.slice(0, 8)}`;
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(stateRef, {
        ...state,
        activeReward: {
          ...activeReward,
          status: 'REDEEMED',
          redeemedAt: now,
        },
        updatedAt: now,
      }, { merge: true });
      tx.set(idemRef, { redeemedAt: now, actionId });
      tx.set(db.collection(STAMP_EVENTS).doc(), {
        uid,
        programId,
        partnerId,
        eventType: 'REWARD_REDEEMED',
        createdAt: now,
        staffUid,
      });
      tx.set(db.collection(VERIFIED_ACTIONS).doc(actionId), {
        id: actionId,
        uid,
        partnerId,
        perkId: programId,
        refType: 'stamp',
        refId: programId,
        reasonCode: 'EMIT_STAMP_REWARD_REDEEMED',
        pointsAwarded: 0,
        createdAt: now,
        actionType: 'STAMP_REWARD_REDEEMED',
      });
    });

    return { success: true, actionId, message: 'Reward redeemed.' };
  });

/** Get one stamp program by id. */
export const stampCardsGetProgram = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    const d = data as Record<string, unknown> | null | undefined;
    const programId = typeof d?.programId === 'string' ? d.programId.trim() : '';
    if (!programId) return { success: false, message: 'programId required.' };
    const snap = await db.collection(STAMP_PROGRAMS).doc(programId).get();
    if (!snap.exists) return { success: false, message: 'Program not found.' };
    return { success: true, program: { id: snap.id, ...snap.data() } };
  });

/** Get active stamp program for a partner (for partner profile discovery). */
export const stampCardsGetActiveProgramForPartner = functions
  .region('us-central1')
  .https.onCall(async (data: unknown) => {
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    if (!partnerId) return { success: false, message: 'partnerId required.' };
    const snap = await db.collection(STAMP_PROGRAMS).where('partnerId', '==', partnerId).where('status', '==', 'ACTIVE').limit(1).get();
    if (snap.empty) return { success: true, program: null };
    const doc = snap.docs[0];
    return { success: true, program: { id: doc.id, ...doc.data() } };
  });

/** List active stamp programs for a partner (dashboard). */
export const stampCardsListProgramsForPartner = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = resolvePartnerId(d, context.auth.uid, isAdminContext(context));
    const snap = await db.collection(STAMP_PROGRAMS).where('partnerId', '==', partnerId).get();
    const programs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, programs };
  });

/** Get user's stamp card state for a program (or all for uid). */
export const stampCardsGetUserState = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const programId = typeof d?.programId === 'string' ? d.programId.trim() : null;
    if (programId) {
      const stateRef = db.collection(STAMP_CARD_STATE).doc(`${uid}_${programId}`);
      const snap = await stateRef.get();
      if (!snap.exists) return { success: true, state: null };
      return { success: true, state: { id: snap.id, ...snap.data() } };
    }
    const snap = await db.collection(STAMP_CARD_STATE).where('uid', '==', uid).get();
    const states = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, states };
  });

/** Create or update stamp program (partner only). Accepts optional partnerId for admin testing as demo partner. */
export const stampCardsUpsertProgram = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = resolvePartnerId(d, context.auth.uid, isAdminContext(context));
    if (partnerId !== DEMO_PARTNER_ID) {
      const partnerSnap = await db.collection(PARTNERS).doc(partnerId).get();
      if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    }
    const elig = d?.eligibility as Record<string, unknown> | null | undefined;
    const caps = d?.caps as Record<string, unknown> | null | undefined;
    const reward = d?.reward as Record<string, unknown> | null | undefined;
    const design = d?.design as Record<string, unknown> | null | undefined;

    const programId = typeof d?.id === 'string' ? d.id.trim() : null;
    const name = typeof d?.name === 'string' ? d.name.trim() : 'Stamp Card';
    const status = (d?.status as string) === 'ACTIVE' ? 'ACTIVE' : 'DRAFT';
    const stampsRequired = typeof d?.stampsRequired === 'number' ? Math.min(12, Math.max(5, d.stampsRequired)) : 10;
    const ch = Number(d?.cooldownHours);
    const cooldownHours = [4, 12, 24].includes(ch) ? ch : 24;
    const now = Date.now();
    const program: Record<string, unknown> = {
      partnerId,
      status,
      name,
      description: typeof d?.description === 'string' ? d.description.trim().slice(0, 200) : '',
      stampsRequired,
      cooldownHours,
      eligibility: {
        requireVerifiedUser: elig?.requireVerifiedUser !== false,
        requirePartnerVerified: elig?.requirePartnerVerified !== false,
      },
      caps: {
        maxStampsPerUserPerDay: typeof caps?.maxStampsPerUserPerDay === 'number' ? caps.maxStampsPerUserPerDay : 1,
        maxRewardsPerDay: typeof caps?.maxRewardsPerDay === 'number' ? caps.maxRewardsPerDay : null,
      },
      reward: {
        type: (reward?.type as string) || 'FREE_ITEM',
        label: typeof reward?.label === 'string' ? (reward.label as string).slice(0, 100) : 'Free reward',
        expiresHoursAfterEarn: typeof reward?.expiresHoursAfterEarn === 'number' ? reward.expiresHoursAfterEarn : null,
        otPointsBonus: reward?.otPointsBonus != null ? Number(reward.otPointsBonus) : null,
      },
      design: {
        template: (design?.template as string) || 'COFFEE',
        colors: design?.colors && typeof design.colors === 'object' ? design.colors : { primary: '#1e3a5f', secondary: '#3b82f6' },
        iconLogoRef: typeof design?.iconLogoRef === 'string' ? design.iconLogoRef : null,
        stampStyle: (design?.stampStyle as string) || 'ORB',
      },
      updatedAt: now,
    };
    const boostWindowsRaw = d?.boostWindows;
    if (Array.isArray(boostWindowsRaw) && boostWindowsRaw.length > 0) {
      const windows = boostWindowsRaw
        .filter((w: unknown) => w && typeof w === 'object' && typeof (w as { startHour?: number }).startHour === 'number' && typeof (w as { endHour?: number }).endHour === 'number')
        .map((w: { startHour: number; endHour: number }) => ({ startHour: Math.max(0, Math.min(23, (w as { startHour: number }).startHour)), endHour: Math.max(0, Math.min(23, (w as { endHour: number }).endHour)) }));
      if (windows.length > 0) (program as Record<string, unknown>).boostWindows = windows;
    }
    if (programId) {
      const ref = db.collection(STAMP_PROGRAMS).doc(programId);
      const snap = await ref.get();
      if (!snap.exists || (snap.data()?.partnerId as string) !== partnerId) {
        return { success: false, message: 'Program not found or not owner.' };
      }
      program.createdAt = (snap.data()?.createdAt as number) ?? now;
      await ref.update(program);
      return { success: true, id: programId, program: { id: programId, ...program } };
    }
    program.createdAt = now;
    const ref = await db.collection(STAMP_PROGRAMS).add(program);
    return { success: true, id: ref.id, program: { id: ref.id, ...program } };
  });
