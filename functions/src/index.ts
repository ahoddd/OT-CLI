/**
 * OrbTap Verify — Verify-Before-Create anti-bot strategy.
 * No account is created until the user proves they control the email (6-digit code).
 * Rate limiting, one-time codes, and short expiry make bulk signups and bots impractical.
 *
 * Config: Stored in Secret Manager as ORPTAPSECRET (JSON with env.encryption_key, env.resend_api_key, env.orbtap_from_email).
 * Migrated from deprecated functions.config() via firebase functions:config:export.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import * as crypto from 'crypto';

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const ORPTAP_SECRET_ENV_KEY = 'ORPTAPSECRET';

/** Get env object from Secret Manager (ORPTAPSECRET). In 1st gen, the secret is injected as process.env.ORPTAPSECRET JSON string. */
function getSecretEnv(): Record<string, string> {
  try {
    const raw = process.env[ORPTAP_SECRET_ENV_KEY];
    if (raw && typeof raw === 'string') {
      const parsed = JSON.parse(raw) as { env?: Record<string, string> };
      return parsed?.env ?? {};
    }
  } catch {
    // ignore
  }
  return {};
}

/** Get config value from secret env or process.env. Use inside functions that have .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY] }). */
function getConfig(env: Record<string, string> | undefined, key: string): string {
  return env?.[key] || process.env[key] || '';
}

// Used by verifyEmailCode + getFoundingStats
const META_STATS = 'metaStats';
const STATS_DOC = 'global';
const FOUNDING_CAPS = [500, 2000, 10000, 100000];
const FOUNDING_BADGE_IDS = ['founding_500', 'founding_2k', 'founding_10k', 'founding_100k'];

const VERIFICATION_CODES = 'verificationCodes';
const RATE_LIMIT = 'verificationRateLimit';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CODES_PER_EMAIL_PER_HOUR = 3;
const MAX_CODES_PER_IP_PER_DAY = 10;
const MINIMUM_AGE = 13;

function getAgeFromBirthDate(year: number, month: number, day: number): number {
  const birth = new Date(year, month - 1, day);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getEncryptionKey(env: Record<string, string> | undefined): Buffer {
  const key = getConfig(env, 'encryption_key') || getConfig(env, 'ENCRYPTION_KEY');
  if (!key || key.length < 64) {
    throw new Error('encryption_key must be set (64+ hex chars) in ORPTAPSECRET or env');
  }
  return Buffer.from(key.slice(0, 64), 'hex');
}

function encrypt(text: string, env: Record<string, string> | undefined): string {
  const key = getEncryptionKey(env);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('base64') + ':' + tag.toString('base64') + ':' + enc.toString('base64');
}

function decrypt(encrypted: string, env: Record<string, string> | undefined): string {
  const key = getEncryptionKey(env);
  const [ivB, tagB, encB] = encrypted.split(':');
  const iv = Buffer.from(ivB!, 'base64');
  const tag = Buffer.from(tagB!, 'base64');
  const enc = Buffer.from(encB!, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final('utf8');
}

function safeEmailId(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 100);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function checkRateLimitEmail(email: string): Promise<void> {
  const id = safeEmailId(email);
  const ref = db.collection(RATE_LIMIT).doc(`email_${id}`);
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const snap = await ref.get();
  const data = snap.data();
  const timestamps: number[] = (data?.timestamps as number[]) || [];
  const recent = timestamps.filter((t) => t > oneHourAgo);
  if (recent.length >= MAX_CODES_PER_EMAIL_PER_HOUR) {
    throw new Error('Too many codes sent to this email. Try again in an hour.');
  }
  recent.push(now);
  await ref.set({ timestamps: recent.slice(-MAX_CODES_PER_EMAIL_PER_HOUR * 2) });
}

async function checkRateLimitIp(ip: string): Promise<void> {
  const safe = ip.replace(/[^a-z0-9.]/gi, '_').slice(0, 50);
  const ref = db.collection(RATE_LIMIT).doc(`ip_${safe}`);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const snap = await ref.get();
  const data = snap.data();
  const timestamps: number[] = (data?.timestamps as number[]) || [];
  const recent = timestamps.filter((t) => t > oneDayAgo);
  if (recent.length >= MAX_CODES_PER_IP_PER_DAY) {
    throw new Error('Too many verification attempts from this device. Try again tomorrow.');
  }
  recent.push(now);
  await ref.set({ timestamps: recent.slice(-MAX_CODES_PER_IP_PER_DAY * 2) });
}

/**
 * Request a 6-digit verification code. Sends email and stores encrypted signup data.
 * Rate limited by email and IP to prevent bots.
 */
export const requestVerificationCode = functions
  .region('us-central1')
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY] })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    const env = getSecretEnv();
    const d = data as Record<string, unknown> | null | undefined;
    const email = typeof d?.email === 'string' ? (d.email as string).trim().toLowerCase() : '';
    const password = typeof d?.password === 'string' ? d.password : '';
    const displayName = typeof d?.displayName === 'string' ? (d.displayName as string).trim() : '';
    const birthDate = d?.birthDate as { year: number; month: number; day: number } | undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: 'Valid email is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    if (!birthDate || typeof birthDate.year !== 'number' || typeof birthDate.month !== 'number' || typeof birthDate.day !== 'number') {
      return { success: false, message: 'Date of birth is required. You must be at least ' + MINIMUM_AGE + ' years old to create an account.' };
    }
    const { year, month, day } = birthDate;
    const age = getAgeFromBirthDate(year, month, day);
    if (age < MINIMUM_AGE) {
      return { success: false, message: 'You must be at least ' + MINIMUM_AGE + ' years old to create an OrbTap account.' };
    }

    const ip = (context.rawRequest?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    await checkRateLimitEmail(email);
    await checkRateLimitIp(ip);

    const code = generateCode();
    const expiry = Date.now() + CODE_EXPIRY_MS;
    const encPassword = encrypt(password, env);
    const docId = safeEmailId(email);
    await db.collection(VERIFICATION_CODES).doc(docId).set({
      email,
      encPassword,
      displayName: displayName || email.split('@')[0],
      code,
      expiry,
      createdAt: Date.now(),
      ageVerifiedAt: Date.now(),
      birthYear: year,
    });

    const resendKey = getConfig(env, 'resend_api_key') || getConfig(env, 'RESEND_API_KEY');
    const fromEmail = getConfig(env, 'orbtap_from_email') || getConfig(env, 'ORBTAP_FROM_EMAIL') || 'OrbTap <verify@orbtap.com>';
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Your OrbTap verification code',
        html: `
          <p>Your OrbTap verification code is:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
          <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          <p>— OrbTap</p>
        `,
      });
    }
    // If no Resend key, code is still stored — use Firebase Emulator or set RESEND_API_KEY

    return { success: true };
  });

/**
 * Verify the 6-digit code and create the user. Returns a custom token to sign in.
 * One-time use; doc is deleted after success.
 */
export const verifyEmailCode = functions
  .region('us-central1')
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY] })
  .https.onCall(async (data: unknown) => {
    const env = getSecretEnv();
    const d = data as Record<string, unknown> | null | undefined;
    const email = typeof d?.email === 'string' ? (d.email as string).trim().toLowerCase() : '';
    const code = typeof d?.code === 'string' ? (d.code as string).replace(/\D/g, '').slice(0, 6) : '';
    const password = typeof d?.password === 'string' ? d.password : '';
    const displayName = typeof d?.displayName === 'string' ? (d.displayName as string).trim() : '';

    if (!email || !code || code.length !== 6) {
      return { success: false, message: 'Email and 6-digit code are required.' };
    }

    const docId = safeEmailId(email);
    const ref = db.collection(VERIFICATION_CODES).doc(docId);
    const snap = await ref.get();
    const doc = snap.data();
    if (!doc) {
      return { success: false, message: 'Invalid or expired code. Request a new one.' };
    }
    if (doc.code !== code) {
      return { success: false, message: 'Invalid code.' };
    }
    if (Date.now() > doc.expiry) {
      await ref.delete();
      return { success: false, message: 'Code expired. Request a new one.' };
    }

    let plainPassword = password;
    if (doc.encPassword) {
      try {
        plainPassword = decrypt(doc.encPassword as string, env);
      } catch {
        await ref.delete();
        return { success: false, message: 'Verification failed. Request a new code.' };
      }
    }
    const name = displayName || doc.displayName || email.split('@')[0];

    try {
      const userRecord = await auth.createUser({
        email,
        password: plainPassword,
        displayName: name,
        emailVerified: true,
      });
      const uid = userRecord.uid;
      const statsRef = db.collection(META_STATS).doc(STATS_DOC);
      const userRef = db.collection('users').doc(uid);
      await db.runTransaction(async (tx) => {
        const statsSnap = await tx.get(statsRef);
        const prev = (statsSnap.data()?.totalUsers as number) ?? 0;
        const next = prev + 1;
        tx.set(statsRef, { totalUsers: next }, { merge: true });
        const badges: string[] = [];
        for (let i = 0; i < FOUNDING_CAPS.length; i++) {
          if (next <= FOUNDING_CAPS[i]) badges.push(FOUNDING_BADGE_IDS[i]);
        }
        const usernameNormalized = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 32);
        tx.set(userRef, {
          displayName: name,
          username: usernameNormalized || null,
          discoverable: true,
          badges,
          createdAt: FieldValue.serverTimestamp(),
          ageVerifiedAt: doc?.ageVerifiedAt ?? FieldValue.serverTimestamp(),
          birthYear: doc?.birthYear ?? null,
        }, { merge: true });
        return next;
      });
      const customToken = await auth.createCustomToken(uid);
      await ref.delete();
      return { success: true, customToken };
    } catch (e: any) {
      if (e?.code === 'auth/email-already-exists') {
        await ref.delete();
        return { success: false, message: 'This email is already registered. Sign in instead.' };
      }
      return { success: false, message: e?.message || 'Could not create account.' };
    }
  });

/**
 * Initialize user profile and founding stats after client-side signup (Firebase Auth + sendEmailVerification).
 * Call this once right after createUserWithEmailAndPassword + sendEmailVerification. Creates users/{uid} and increments totalUsers.
 */
export const initializeUserProfile = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const displayName = typeof d?.displayName === 'string' ? d.displayName.trim() : '';
    const birthYear = typeof d?.birthYear === 'number' && d.birthYear >= 1900 && d.birthYear <= new Date().getFullYear() ? d.birthYear : null;
    const name = displayName || (context.auth.token?.email ? context.auth.token.email.split('@')[0] : 'User');
    const statsRef = db.collection(META_STATS).doc(STATS_DOC);
    const userRef = db.collection('users').doc(uid);
    try {
      await db.runTransaction(async (tx: admin.firestore.Transaction) => {
        const statsSnap = await tx.get(statsRef);
        const prev = (statsSnap.data()?.totalUsers as number) ?? 0;
        const next = prev + 1;
        tx.set(statsRef, { totalUsers: next }, { merge: true });
        const badges: string[] = [];
        for (let i = 0; i < FOUNDING_CAPS.length; i++) {
          if (next <= FOUNDING_CAPS[i]) badges.push(FOUNDING_BADGE_IDS[i]);
        }
        const usernameNormalized = (name || 'user').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 32);
        tx.set(userRef, {
          displayName: name,
          username: usernameNormalized || null,
          discoverable: true,
          badges,
          createdAt: FieldValue.serverTimestamp(),
          ageVerifiedAt: FieldValue.serverTimestamp(),
          birthYear,
        }, { merge: true });
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Could not initialize profile.' };
    }
  });

// --- Remote redemption (one-time codes, no self-redemption) ---
const REDEMPTION_TOKENS = 'redemptionTokens';
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PARTNERS = 'partners';

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Create a one-time redemption token for a remote order. Called by partner backend or admin.
 * Returns a short code the user enters in-app to verify and receive OT. No self-redemption.
 */
export const createRedemptionToken = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? (d.partnerId as string).trim() : '';
    const userId = typeof d?.userId === 'string' ? (d.userId as string).trim() : '';
    const perkId = typeof d?.perkId === 'string' ? (d.perkId as string).trim() : '';
    const points = typeof d?.points === 'number' ? Math.max(0, Math.floor(d.points as number)) : 0;

    if (!partnerId || !userId || !perkId || points <= 0) {
      return { success: false, message: 'partnerId, userId, perkId, and points are required.' };
    }

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    const ownerUid = partnerSnap.data()?.ownerUid as string | undefined;
    if (ownerUid && userId === ownerUid) {
      return { success: false, message: 'Self-redemption not allowed.' };
    }

    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + TOKEN_TTL_MS;
    await db.collection(REDEMPTION_TOKENS).doc(token).set({
      token,
      partnerId,
      userId,
      perkId,
      points,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return { success: true, token, expiresAt: Math.floor(expiresAt / 1000) };
  });

/**
 * Redeem a one-time token. Call with auth. Validates expiry and no self-redemption; returns payload for client to apply (createVerifiedAction).
 */
export const redeemRemoteToken = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      return { success: false, message: 'Must be signed in to redeem.' };
    }
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const token = typeof d?.token === 'string' ? (d.token as string).replace(/\s/g, '').toUpperCase() : '';

    if (!token || token.length < 6) {
      return { success: false, message: 'Valid token is required.' };
    }

    const ref = db.collection(REDEMPTION_TOKENS).doc(token);
    const snap = await ref.get();
    const doc = snap.data();
    if (!doc || doc.used) {
      return { success: false, message: 'Invalid or already used token.' };
    }
    if (Date.now() > doc.expiresAt) {
      await ref.update({ used: true });
      return { success: false, message: 'Token expired.' };
    }
    if (doc.userId !== uid) {
      return { success: false, message: 'This token was issued for another user.' };
    }

    const partnerRef = db.collection(PARTNERS).doc(doc.partnerId);
    const partnerSnap = await partnerRef.get();
    const ownerUid = partnerSnap.data()?.ownerUid as string | undefined;
    if (ownerUid && uid === ownerUid) {
      return { success: false, message: 'Self-redemption not allowed.' };
    }

    await ref.update({ used: true, usedAt: Date.now(), usedBy: uid });

    return {
      success: true,
      partnerId: doc.partnerId,
      perkId: doc.perkId,
      points: doc.points,
      message: 'Redeemed. Apply verified action on client.',
    };
  });

// --- Perk redemption: user-bound one-time QR (anti-fraud) ---
const PERK_REDEEM_TOKENS = 'perkRedeemTokens';
const PERK_REDEEM_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generatePerkRedeemToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Create a one-time, user-bound redemption token for showing a QR at the venue.
 * Called by the customer (auth). Token is tied to uid; only the partner can verify it (scan).
 * Prevents sharing/screenshot fraud: each QR is unique to that user and single-use.
 */
export const createPerkRedeemToken = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? (d.partnerId as string).trim() : '';
    const perkId = typeof d?.perkId === 'string' ? (d.perkId as string).trim() : '';
    let points = typeof d?.points === 'number' ? Math.max(0, Math.floor(d.points as number)) : 0;

    if (!partnerId || !perkId) return { success: false, message: 'partnerId and perkId are required.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    const ownerUid = partnerSnap.data()?.ownerUid as string | undefined;
    const partnerOwnerUid = ownerUid || partnerId;
    if (uid === partnerOwnerUid) return { success: false, message: 'Partners cannot create a redeem token for their own venue.' };

    if (points <= 0) {
      const perkSnap = await db.collection('perks').doc(perkId).get();
      const perkData = perkSnap.data();
      const cost = perkData?.cost ?? perkData?.points;
      points = typeof cost === 'number' && !Number.isNaN(cost) ? Math.max(0, Math.floor(cost)) : EMISSION_RATES.EMIT_VERIFIED_REDEEM ?? 50;
    }

    try {
      await checkRateLimit(RATE_LIMIT_VERIFY, `uid_${safeId(uid)}`, RATE_LIMIT_REDEEM_PER_UID_WINDOW_MS, RATE_LIMIT_REDEEM_PER_UID_MAX);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const token = generatePerkRedeemToken();
    const now = Date.now();
    const expiresAt = now + PERK_REDEEM_TOKEN_TTL_MS;
    await db.collection(PERK_REDEEM_TOKENS).doc(token).set({
      token,
      userId: uid,
      partnerId,
      perkId,
      points,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return { success: true, token, expiresAt: Math.floor(expiresAt / 1000), points };
  });

/**
 * Verify a customer's one-time redemption QR. Callable only by the partner (venue).
 * Marks token used and credits the token's userId (the customer). Prevents gaming: QR is user-bound and one-time.
 */
export const verifyPerkRedeemToken = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const callerUid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const token = typeof d?.token === 'string' ? (d.token as string).replace(/\s/g, '').toUpperCase() : '';

    if (!token || token.length < 8) return { success: false, message: 'Valid token is required.' };

    const ref = db.collection(PERK_REDEEM_TOKENS).doc(token);
    const snap = await ref.get();
    const doc = snap.data();
    if (!doc || doc.used) return { success: false, message: 'Invalid or already used code.' };
    if (Date.now() > doc.expiresAt) {
      await ref.update({ used: true });
      return { success: false, message: 'This code has expired.' };
    }

    const partnerRef = db.collection(PARTNERS).doc(doc.partnerId);
    const partnerSnap = await partnerRef.get();
    const ownerUid = (partnerSnap.data()?.ownerUid as string | undefined) || doc.partnerId;
    if (callerUid !== ownerUid) {
      return { success: false, message: 'Only this venue can verify this code. Use the Scan tab when the customer shows their QR.' };
    }

    const customerUid = doc.userId;
    const points = typeof doc.points === 'number' ? doc.points : EMISSION_RATES.EMIT_VERIFIED_REDEEM ?? 50;
    const reasonCode = 'EMIT_VERIFIED_REDEEM';
    const idemKey = idempotencyKeyEarn(customerUid, 'perk', doc.perkId, reasonCode);
    const idemRef = db.collection(EARN_IDEMPOTENCY).doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      await ref.update({ used: true, usedAt: Date.now(), usedBy: callerUid });
      return { success: false, message: 'This customer already redeemed this perk recently. Code accepted but no double credit.' };
    }

    const ledgerRef = db.collection(LEDGERS).doc(customerUid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    const newBalance = currentBalance + points;
    const actionId = `va_${Date.now()}_${customerUid.slice(0, 8)}`;

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.update(ref, { used: true, usedAt: Date.now(), usedBy: callerUid });
      tx.set(idemRef, { actionId, pointsAwarded: points, balance: newBalance, createdAt: Date.now() });
      tx.set(db.collection(VERIFIED_ACTIONS).doc(actionId), {
        id: actionId,
        uid: customerUid,
        partnerId: doc.partnerId,
        perkId: doc.perkId,
        refType: 'perk',
        refId: doc.perkId,
        reasonCode,
        pointsAwarded: points,
        createdAt: Date.now(),
      });
      tx.set(ledgerRef, { balance: newBalance, updatedAt: Date.now() }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'earn',
        amount: points,
        reason: reasonCode,
        ref: { actionId, partnerId: doc.partnerId, perkId: doc.perkId },
        createdAt: Date.now(),
      });
    });

    await recordIntegrityEvent('PERK_REDEEM_TOKEN_VERIFIED', callerUid, { token: token.slice(0, 4), customerUid, perkId: doc.perkId }, doc.partnerId);
    return { success: true, message: 'Redeemed.', pointsAwarded: points, actionId };
  });

/**
 * Return founding member stats for FOMO display: totalUsers and spots left per tier.
 * Callable without auth so pre-login screens can show "X spots left".
 */
export const getFoundingStats = functions
  .region('us-central1')
  .https.onCall(async () => {
    const statsRef = db.collection(META_STATS).doc(STATS_DOC);
    const snap = await statsRef.get();
    const totalUsers = (snap.data()?.totalUsers as number) ?? 0;
    return {
      success: true,
      totalUsers,
      founding500SpotsLeft: Math.max(0, 500 - totalUsers),
      founding2kSpotsLeft: Math.max(0, 2000 - totalUsers),
      founding10kSpotsLeft: Math.max(0, 10000 - totalUsers),
      founding100kSpotsLeft: Math.max(0, 100000 - totalUsers),
    };
  });

/** Global stats for landing/premium social proof: userCount, partnerCount, totalRedemptions. */
export const getGlobalStats = functions
  .region('us-central1')
  .https.onCall(async () => {
    const statsRef = db.collection(META_STATS).doc(STATS_DOC);
    const snap = await statsRef.get();
    const d = snap.data() || {};
    return {
      success: true,
      userCount: (d.totalUsers as number) ?? 0,
      partnerCount: (d.partnerCount as number) ?? 0,
      totalRedemptions: (d.totalRedemptions as number) ?? 0,
    };
  });

// ========== SERVER-AUTHORITATIVE FRAUD DEFENSES ==========

const VERIFIED_ACTIONS = 'verifiedActions';
const LEDGERS = 'ledgers';
const EARN_IDEMPOTENCY = 'earnIdempotency';
const INTEGRITY_EVENTS = 'integrityEvents';
const RATE_LIMIT_VERIFY = 'rateLimitVerify';
const RATE_LIMIT_SPEND = 'rateLimitSpend';

const RATE_LIMIT_REDEEM_PER_UID_WINDOW_MS = 60 * 60 * 1000; // 1h
const RATE_LIMIT_REDEEM_PER_UID_MAX = 30;
const RATE_LIMIT_SPEND_PER_UID_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_SPEND_PER_UID_MAX = 40;

function safeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

function idempotencyKeyEarn(uid: string, refType: string, refId: string, reasonCode: string): string {
  return safeId(`${uid}_${refType}_${refId}_${reasonCode}`);
}

/** Fixed-window rate limit: throws if over limit, otherwise records and returns. */
async function checkRateLimit(
  collection: string,
  docId: string,
  windowMs: number,
  maxCount: number
): Promise<void> {
  const ref = db.collection(collection).doc(docId);
  const now = Date.now();
  const windowStart = now - windowMs;
  const snap = await ref.get();
  const data = snap.data();
  const timestamps: number[] = Array.isArray(data?.timestamps) ? data.timestamps : [];
  const recent = timestamps.filter((t) => t > windowStart);
  if (recent.length >= maxCount) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
  recent.push(now);
  await ref.set({ timestamps: recent.slice(-maxCount * 2) }, { merge: true });
}

async function recordIntegrityEvent(
  type: string,
  uid: string,
  meta?: Record<string, unknown>,
  partnerId?: string
): Promise<void> {
  await db.collection(INTEGRITY_EVENTS).add({
    type,
    uid,
    partnerId: partnerId || null,
    meta: meta || {},
    createdAt: Date.now(),
  });
}

const EMISSION_RATES: Record<string, number> = {
  EMIT_VERIFIED_REDEEM: 55,       // midpoint; actual earn uses variable range below
  EMIT_DROP_REDEEM: 75,
  EMIT_QUEST_COMPLETE: 50,
  EMIT_VERIFIED_CHECKIN: 25,
  EMIT_WORK_ORDER_COMPLETE: 60,
  EMIT_DAILY_ORB_RITUAL: 50,
  EMIT_FIRST_DAILY_SCAN: 15,      // bonus on top of normal earn for first scan of day
  EMIT_STAMP_EARNED: 0,
  EMIT_STAMP_CARD_COMPLETE_BONUS: 25,
  EMIT_STAMP_CARD_OT_BONUS: 50,
  EMIT_STAMP_REWARD_REDEEMED: 0,
};

/** Variable reward range for verified redeem — slot-machine psychology, 30–80 OT. */
const EMIT_VERIFIED_REDEEM_MIN = 30;
const EMIT_VERIFIED_REDEEM_MAX = 80;

function getVariableRedeemPoints(): number {
  const range = EMIT_VERIFIED_REDEEM_MAX - EMIT_VERIFIED_REDEEM_MIN + 1;
  return EMIT_VERIFIED_REDEEM_MIN + Math.floor(Math.random() * range);
}

const RITUAL_CLAIMS = 'ritualClaims';
const RITUAL_CONFIG_COLLECTION = 'config';
const RITUAL_CONFIG_DOC = 'dailyRitual';
const RITUAL_POINTS_MIN_DEFAULT = 1;
const RITUAL_POINTS_MAX_DEFAULT = 100;

/* ─────────────────────────────────────────────────────────────
 * ANTI-CHEAT: GPS proximity + velocity checks
 * ──────────────────────────────────────────────────────────── */

/** Max distance (metres) between user GPS and partner location for a scan to count. */
const GPS_PROXIMITY_MAX_METRES = 200;
/** Max earns from the SAME partner per user within this many ms (6 hours). */
const VELOCITY_PARTNER_COOLDOWN_MS = 6 * 60 * 60 * 1000;
/** Max unique partners a user can earn from in a single calendar day. */
const VELOCITY_MAX_PARTNERS_PER_DAY = 5;
/** Firestore collection for per-user scan velocity tracking. */
const VELOCITY_COLLECTION = 'scanVelocity';

/** Haversine distance in metres between two lat/lng points. */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verify GPS proximity: if partner has a location and client sent GPS coords,
 * check that the user is within GPS_PROXIMITY_MAX_METRES.
 * Returns an error string if out-of-range, or null if ok.
 */
async function checkGpsProximity(
  partnerId: string,
  clientLat: number | null,
  clientLng: number | null
): Promise<string | null> {
  if (!clientLat || !clientLng || !partnerId) return null; // no GPS data — skip (graceful)
  const partnerDoc = await db.collection('partners').doc(partnerId).get();
  if (!partnerDoc.exists) return null;
  const loc = partnerDoc.data()?.location as { lat?: number; lng?: number } | undefined;
  if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return null;
  const dist = haversineMetres(clientLat, clientLng, loc.lat, loc.lng);
  if (dist > GPS_PROXIMITY_MAX_METRES) {
    return `You must be at the venue to redeem (${Math.round(dist)}m away, max ${GPS_PROXIMITY_MAX_METRES}m).`;
  }
  return null;
}

/**
 * Velocity check: enforce cooldown per partner and daily unique-partner cap.
 * Reads/writes to VELOCITY_COLLECTION/{uid} document.
 * Returns an error string if rate-limited, or null if ok.
 */
async function checkScanVelocity(uid: string, partnerId: string): Promise<string | null> {
  if (!partnerId) return null;
  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const velRef = db.collection(VELOCITY_COLLECTION).doc(uid);
  const velSnap = await velRef.get();
  const vel = (velSnap.data() ?? {}) as {
    partnerLastScan?: Record<string, number>;
    dailyPartners?: Record<string, string[]>;
  };

  const partnerLastScan: Record<string, number> = vel.partnerLastScan ?? {};
  const dailyPartners: Record<string, string[]> = vel.dailyPartners ?? {};

  // 1. Per-partner cooldown (6h)
  const lastScan = partnerLastScan[partnerId] ?? 0;
  if (now - lastScan < VELOCITY_PARTNER_COOLDOWN_MS) {
    const remaining = Math.ceil((VELOCITY_PARTNER_COOLDOWN_MS - (now - lastScan)) / 60000);
    return `Already earned at this partner recently. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`;
  }

  // 2. Daily unique-partner cap
  const todayPartners: string[] = dailyPartners[todayKey] ?? [];
  if (!todayPartners.includes(partnerId) && todayPartners.length >= VELOCITY_MAX_PARTNERS_PER_DAY) {
    return `Daily partner scan limit reached (${VELOCITY_MAX_PARTNERS_PER_DAY} partners/day). Come back tomorrow!`;
  }

  // Update velocity record
  const updatedToday = todayPartners.includes(partnerId)
    ? todayPartners
    : [...todayPartners, partnerId];
  await velRef.set(
    {
      partnerLastScan: { ...partnerLastScan, [partnerId]: now },
      dailyPartners: { ...dailyPartners, [todayKey]: updatedToday },
      updatedAt: now,
    },
    { merge: true }
  );
  return null;
}
const RITUAL_BADGE_TIERS = ['common', 'rare', 'legendary', 'apex'] as const;
const RITUAL_BADGE_PROBS_DEFAULT = [0.02, 0.005, 0.0005, 0.0001];

/**
 * Server-authoritative verified action earn. Idempotent per (uid, refType, refId, reasonCode).
 * Rate limited per uid. Writes verifiedActions + ledger entry.
 */
export const awardVerifiedAction = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const refType = typeof d?.refType === 'string' ? d.refType.trim() : 'perk';
    const refId = typeof d?.refId === 'string' ? d.refId.trim() : '';
    const reasonCode = typeof d?.reasonCode === 'string' ? d.reasonCode.trim() : 'EMIT_VERIFIED_REDEEM';
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const perkId = typeof d?.perkId === 'string' ? d.perkId.trim() : refId;
    // Optional client GPS coords (sent from scanner HUD)
    const clientLat = typeof d?.clientLat === 'number' ? (d.clientLat as number) : null;
    const clientLng = typeof d?.clientLng === 'number' ? (d.clientLng as number) : null;

    if (!refId && refType === 'perk') {
      return { success: false, message: 'refId (or perkId) is required.' };
    }

    const points = reasonCode === 'EMIT_VERIFIED_REDEEM'
      ? getVariableRedeemPoints()
      : (EMISSION_RATES[reasonCode] ?? EMISSION_RATES.EMIT_VERIFIED_REDEEM ?? 50);
    const idemKey = idempotencyKeyEarn(uid, refType, refId, reasonCode);

    try {
      await checkRateLimit(RATE_LIMIT_VERIFY, `uid_${safeId(uid)}`, RATE_LIMIT_REDEEM_PER_UID_WINDOW_MS, RATE_LIMIT_REDEEM_PER_UID_MAX);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    // ── Anti-cheat: GPS proximity check ──────────────────────────────────────
    if (reasonCode === 'EMIT_VERIFIED_REDEEM' || reasonCode === 'EMIT_VERIFIED_CHECKIN') {
      const gpsError = await checkGpsProximity(partnerId, clientLat, clientLng);
      if (gpsError) {
        await recordIntegrityEvent('GPS_PROXIMITY_FAIL', uid, { partnerId, clientLat, clientLng }, partnerId);
        return { success: false, message: gpsError };
      }
    }

    // ── Anti-cheat: velocity / per-partner cooldown + daily partner cap ───────
    if (partnerId && (reasonCode === 'EMIT_VERIFIED_REDEEM' || reasonCode === 'EMIT_VERIFIED_CHECKIN')) {
      const velError = await checkScanVelocity(uid, partnerId);
      if (velError) {
        return { success: false, message: velError };
      }
    }

    const idemRef = db.collection(EARN_IDEMPOTENCY).doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const existing = idemSnap.data();
      return {
        success: true,
        idempotent: true,
        actionId: existing?.actionId,
        pointsAwarded: existing?.pointsAwarded ?? points,
        balance: existing?.balance,
      };
    }

    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const userRef = db.collection('users').doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    const newBalance = currentBalance + points;
    const actionId = `va_${Date.now()}_${uid.slice(0, 8)}`;

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(idemRef, {
        actionId,
        pointsAwarded: points,
        balance: newBalance,
        createdAt: Date.now(),
      });
      tx.set(db.collection(VERIFIED_ACTIONS).doc(actionId), {
        id: actionId,
        uid,
        partnerId: partnerId || null,
        perkId: perkId || refId,
        refType,
        refId,
        reasonCode,
        pointsAwarded: points,
        createdAt: Date.now(),
      });
      tx.set(ledgerRef, { balance: newBalance, updatedAt: Date.now() }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'earn',
        amount: points,
        reason: reasonCode,
        ref: { actionId, partnerId: partnerId || null, perkId: perkId || null },
        createdAt: Date.now(),
      });
      tx.set(userRef, { xp: FieldValue.increment(points), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    return {
      success: true,
      actionId,
      pointsAwarded: points,
      balance: newBalance,
      idempotent: false,
    };
  });

/** Get friend UIDs for a user (users/{uid}/friends). */
async function getFriendUids(uid: string): Promise<string[]> {
  const snap = await db.collection('users').doc(uid).collection('friends').get();
  return snap.docs.map((d) => d.id).filter(Boolean);
}

function getTodayUtcDateKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Daily Orb Ritual claim. One per user per calendar day (UTC). Idempotent; returns same payload if already claimed.
 */
export const claimDailyOrbRitual = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      return { success: false, message: 'Must be signed in.', pointsAwarded: 0, alreadyClaimed: false, claimedAt: 0, nextEligibleAt: 0 };
    }
    const uid = context.auth.uid;
    const dateKey = getTodayUtcDateKey();
    const claimDocId = `${uid}_${dateKey}`;
    const claimRef = db.collection(RITUAL_CLAIMS).doc(claimDocId);

    const existing = await claimRef.get();
    if (existing.exists) {
      const d = existing.data();
      return {
        success: true,
        pointsAwarded: (d?.pointsAwarded as number) ?? 0,
        badgeAwarded: d?.badgeAwarded ?? undefined,
        alreadyClaimed: true,
        claimedAt: (d?.claimedAt as number) ?? Date.now(),
        nextEligibleAt: new Date(Date.now() + 86400000).setUTCHours(0, 0, 0, 0),
      };
    }

    const configSnap = await db.collection(RITUAL_CONFIG_COLLECTION).doc(RITUAL_CONFIG_DOC).get();
    const config = configSnap.exists ? configSnap.data() : null;
    const pointsConfig = config?.points as { min?: number; max?: number; buckets?: Array<{ min: number; max: number; weight: number }> } | undefined;
    const badgesConfig = config?.badges as { enabled?: boolean; probabilitiesByTier?: { common?: number; rare?: number; legendary?: number; apex?: number } } | undefined;

    let points: number;
    if (pointsConfig?.buckets && Array.isArray(pointsConfig.buckets) && pointsConfig.buckets.length > 0) {
      const totalWeight = pointsConfig.buckets.reduce((s, b) => s + (b.weight || 0), 0);
      let r = Math.random() * totalWeight;
      let chosen = pointsConfig.buckets[0];
      for (const b of pointsConfig.buckets) {
        r -= b.weight || 0;
        if (r <= 0) { chosen = b; break; }
      }
      const lo = Math.max(0, chosen.min ?? RITUAL_POINTS_MIN_DEFAULT);
      const hi = Math.max(lo, chosen.max ?? RITUAL_POINTS_MAX_DEFAULT);
      points = Math.floor(lo + Math.random() * (hi - lo + 1));
    } else {
      const min = typeof pointsConfig?.min === 'number' ? pointsConfig.min : RITUAL_POINTS_MIN_DEFAULT;
      const max = typeof pointsConfig?.max === 'number' ? pointsConfig.max : RITUAL_POINTS_MAX_DEFAULT;
      points = Math.floor(min + Math.random() * (Math.max(min, max) - min + 1));
    }

    const badgeProbs = badgesConfig?.probabilitiesByTier
      ? [
          Math.max(0, Math.min(1, Number(badgesConfig.probabilitiesByTier.common) || 0)),
          Math.max(0, Math.min(1, Number(badgesConfig.probabilitiesByTier.rare) || 0)),
          Math.max(0, Math.min(1, Number(badgesConfig.probabilitiesByTier.legendary) || 0)),
          Math.max(0, Math.min(1, Number(badgesConfig.probabilitiesByTier.apex) || 0)),
        ]
      : RITUAL_BADGE_PROBS_DEFAULT;
    const badgesEnabled = badgesConfig?.enabled !== false;
    const r = Math.random();
    let badgeAwarded: { badgeId: string; tier: string } | undefined;
    if (badgesEnabled) {
      let cum = 0;
      for (let i = 0; i < RITUAL_BADGE_TIERS.length; i++) {
        cum += badgeProbs[i] ?? 0;
        if (r < cum) {
          badgeAwarded = { badgeId: `badge.${RITUAL_BADGE_TIERS[i]}.earned`, tier: RITUAL_BADGE_TIERS[i] };
          break;
        }
      }
    }

    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    const newBalance = currentBalance + points;
    const now = Date.now();
    const nextEligibleAt = new Date(now + 86400000).setUTCHours(0, 0, 0, 0);

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(claimRef, {
        uid,
        dateKey,
        pointsAwarded: points,
        badgeAwarded: badgeAwarded ?? null,
        claimedAt: now,
      });
      tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'earn',
        amount: points,
        reason: 'EMIT_DAILY_ORB_RITUAL',
        ref: { ritualClaim: claimDocId },
        createdAt: now,
      });
    });

    await recordIntegrityEvent('RITUAL_CLAIM_SUCCESS', uid, { pointsAwarded: points, claimDocId, dateKey });
    if (badgeAwarded) {
      await recordIntegrityEvent('RITUAL_BADGE_AWARDED', uid, { badgeId: badgeAwarded.badgeId, tier: badgeAwarded.tier, claimDocId });
    }

    return {
      success: true,
      pointsAwarded: points,
      badgeAwarded,
      alreadyClaimed: false,
      claimedAt: now,
      nextEligibleAt,
    };
  });

/** Bonus orb tap after watching reward ad — once per day, only if user already claimed regular ritual today. */
const RITUAL_BONUS_POINTS_DEFAULT = 25;
export const claimBonusOrbTapAfterAd = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      return { success: false, message: 'Must be signed in.', pointsAwarded: 0, alreadyClaimed: false };
    }
    const uid = context.auth.uid;
    const dateKey = getTodayUtcDateKey();
    const claimDocId = `${uid}_${dateKey}`;
    const claimRef = db.collection(RITUAL_CLAIMS).doc(claimDocId);
    const claimSnap = await claimRef.get();
    if (!claimSnap.exists) {
      return { success: false, message: 'Complete your daily orb first.', pointsAwarded: 0, alreadyClaimed: false };
    }
    const claimData = claimSnap.data();
    if (claimData?.bonusClaimedAt) {
      return {
        success: true,
        pointsAwarded: (claimData.bonusPointsAwarded as number) ?? 0,
        alreadyClaimed: true,
      };
    }
    const points = typeof claimData?.pointsAwarded === 'number'
      ? Math.min(claimData.pointsAwarded, RITUAL_BONUS_POINTS_DEFAULT)
      : RITUAL_BONUS_POINTS_DEFAULT;
    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    const newBalance = currentBalance + points;
    const now = Date.now();
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.update(claimRef, {
        bonusClaimedAt: now,
        bonusPointsAwarded: points,
      });
      tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'earn',
        amount: points,
        reason: 'EMIT_DAILY_ORB_RITUAL_BONUS',
        ref: { ritualClaim: claimDocId, source: 'reward_ad' },
        createdAt: now,
      });
    });
    return { success: true, pointsAwarded: points, alreadyClaimed: false };
  });

/**
 * Server-authoritative wallet spend. Idempotent by clientNonce. Rate limited per uid.
 */
export const spendWallet = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const productKey = typeof d?.productKey === 'string' ? d.productKey.trim() : '';
    const amountExpected = typeof d?.amountExpected === 'number' ? Math.max(0, Math.floor(d.amountExpected)) : 0;
    const clientNonce = typeof d?.clientNonce === 'string' ? d.clientNonce.trim() : '';
    const refType = typeof d?.refType === 'string' ? d.refType.trim() : '';
    const refId = typeof d?.refId === 'string' ? d.refId.trim() : '';

    if (!productKey || amountExpected <= 0) {
      return { success: false, message: 'productKey and amountExpected are required.' };
    }
    if (!clientNonce) {
      return { success: false, message: 'clientNonce is required for idempotent spend.' };
    }

    const BURN_RULES: Record<string, { cost: number; reason: string; maxPerDay?: number; cooldownDays?: number }> = {
      drop_reserve_fee: { cost: 10, reason: 'BURN_DROP_RESERVE_FEE', maxPerDay: 5 },
      early_access_unlock: { cost: 50, reason: 'BURN_EARLY_ACCESS_UNLOCK', cooldownDays: 1, maxPerDay: 1 },
      quest_reroll: { cost: 25, reason: 'BURN_QUEST_REROLL', maxPerDay: 2 },
      quest_booster: { cost: 30, reason: 'BURN_QUEST_BOOSTER', maxPerDay: 3 },
      streak_shield: { cost: 100, reason: 'BURN_STREAK_SHIELD', cooldownDays: 14, maxPerDay: 1 },
      multiplier_24h: { cost: 40, reason: 'BURN_MULTIPLIER_24H', cooldownDays: 7, maxPerDay: 1 },
      receipt_cosmetics: { cost: 20, reason: 'BURN_RECEIPT_COSMETICS' },
      circle_bonus_pool: { cost: 15, reason: 'BURN_CIRCLE_BONUS_POOL' },
      pulse_alerts_filters: { cost: 35, reason: 'BURN_PULSE_ALERTS_FILTERS', maxPerDay: 1 },
    };
    const rule = BURN_RULES[productKey];
    if (!rule || rule.cost !== amountExpected) {
      return { success: false, message: 'Invalid product or amount.' };
    }

    try {
      await checkRateLimit(RATE_LIMIT_SPEND, `uid_${safeId(uid)}`, RATE_LIMIT_SPEND_PER_UID_WINDOW_MS, RATE_LIMIT_SPEND_PER_UID_MAX);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const spendIdemKey = safeId(`spend_${uid}_${clientNonce}`);
    const spendIdemRef = db.collection(EARN_IDEMPOTENCY).doc(spendIdemKey);
    const spendIdemSnap = await spendIdemRef.get();
    if (spendIdemSnap.exists) {
      const existing = spendIdemSnap.data();
      return {
        success: true,
        idempotent: true,
        balance: existing?.balance,
      };
    }

    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    if (currentBalance < amountExpected) {
      return { success: false, message: 'Insufficient balance.' };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const entriesSnap = await ledgerRef.collection('entries')
      .where('type', '==', 'spend')
      .where('reason', '==', rule.reason)
      .where('createdAt', '>=', todayStartMs)
      .get();
    if (rule.maxPerDay != null && entriesSnap.size >= rule.maxPerDay) {
      return { success: false, message: `Max ${rule.maxPerDay} per day for this product.` };
    }
    if (rule.cooldownDays != null) {
      const cooldownMs = rule.cooldownDays * 24 * 60 * 60 * 1000;
      const lastSpend = await ledgerRef.collection('entries')
        .where('type', '==', 'spend')
        .where('reason', '==', rule.reason)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      if (!lastSpend.empty) {
        const last = lastSpend.docs[0].data().createdAt as number;
        if (Date.now() - last < cooldownMs) {
          return { success: false, message: `Cooldown: ${rule.cooldownDays} days.` };
        }
      }
    }

    const newBalance = currentBalance - amountExpected;
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(spendIdemRef, { balance: newBalance, createdAt: Date.now() });
      tx.set(ledgerRef, { balance: newBalance, updatedAt: Date.now() }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'spend',
        amount: amountExpected,
        reason: rule.reason,
        ref: refType && refId ? { refType, refId } : {},
        clientNonce,
        createdAt: Date.now(),
      });
    });

    return { success: true, balance: newBalance, idempotent: false };
  });

/**
 * Get current OT Points balance from server ledger. Used on app load so client shows authoritative balance across devices.
 */
export const getWalletBalance = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const balance = (ledgerSnap.data()?.balance as number) ?? 0;
    return { success: true, balance };
  });

const MISSION_SPONSORSHIPS = 'missionSponsorships';
const MISSION_BOOST_OT_COST = 200;
const MISSION_BOOST_TARGET_COUNT = 50;

/**
 * Partner mission sponsorship: deduct OT from partner owner and create/update missionSponsorship doc.
 * Caller must be the partner owner (partners/{partnerId}.ownerUid === uid).
 */
export const sponsorMission = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const targetMissionCount = typeof d?.targetMissionCount === 'number' ? Math.max(1, Math.min(200, Math.floor(d.targetMissionCount))) : MISSION_BOOST_TARGET_COUNT;

    if (!partnerId) return { success: false, message: 'partnerId is required.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const ownerUid = (partnerSnap.data()?.ownerUid as string | undefined) || '';
    if (ownerUid !== uid) return { success: false, message: 'Only the partner owner can sponsor missions.' };

    const ledgerRef = db.collection(LEDGERS).doc(uid);
    const ledgerSnap = await ledgerRef.get();
    const currentBalance = (ledgerSnap.data()?.balance as number) ?? 0;
    if (currentBalance < MISSION_BOOST_OT_COST) {
      return { success: false, message: 'Insufficient balance. You need ' + MISSION_BOOST_OT_COST + ' OT to boost.' };
    }

    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const expiresAt = todayEnd.getTime();

    const newBalance = currentBalance - MISSION_BOOST_OT_COST;
    const sponsorshipRef = db.collection(MISSION_SPONSORSHIPS).doc(partnerId);

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'spend',
        amount: MISSION_BOOST_OT_COST,
        reason: 'BURN_MISSION_BOOST',
        ref: { refType: 'missionSponsorship', refId: partnerId },
        createdAt: now,
      });
      tx.set(sponsorshipRef, {
        partnerId,
        uid,
        expiresAt,
        targetMissionCount,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    });

    return {
      success: true,
      balance: newBalance,
      expiresAt,
      targetMissionCount,
      message: 'Mission Boost active. Your venue will appear in up to ' + targetMissionCount + ' user missions today.',
    };
  });

const SEARCH_USERS_LIMIT = 200;
const SEARCH_USERS_MAX_RETURN = 50;

/**
 * Search discoverable users by username or displayName (for People / Add friend). Returns public profile only.
 */
export const searchDiscoverableUsers = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const callerUid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const query = typeof d?.query === 'string' ? d.query.trim().toLowerCase() : '';
    const limit = Math.min(SEARCH_USERS_MAX_RETURN, Math.max(5, typeof d?.limit === 'number' ? d.limit : SEARCH_USERS_MAX_RETURN));
    const usersRef = db.collection('users');
    const snap = await usersRef.where('discoverable', '==', true).limit(SEARCH_USERS_LIMIT).get();
    const results: { uid: string; displayName: string | null; username: string | null }[] = [];
    const q = query.slice(0, 80);
    for (const doc of snap.docs) {
      if (doc.id === callerUid) continue;
      const d2 = doc.data();
      const displayName = (d2.displayName as string) ?? null;
      const username = (d2.username as string) ?? null;
      const dn = (displayName || '').toLowerCase();
      const un = (username || '').toLowerCase();
      if (!q || dn.includes(q) || un.includes(q) || (username && username.toLowerCase().includes(q))) {
        results.push({
          uid: doc.id,
          displayName: displayName || null,
          username: username || null,
        });
        if (results.length >= limit) break;
      }
    }
    return { success: true, users: results };
  });

// ========== ORBOPS™ / ORBWORK ORDERS ==========

const WORK_ORDERS = 'workOrders';
const PROOF_PACKS = 'proofPacks';
const JOB_PROOF_RECEIPTS = 'jobProofReceipts';
const PARTNER_PROOF_PORTFOLIOS = 'partnerProofPortfolios';
const WORK_ORDER_AUDIT = 'workOrderAudit';
const RATE_LIMIT_WORK_ORDER = 'rateLimitWorkOrder';

const WO_CREATE_PER_UID_PER_HOUR = 10;
const WO_MILESTONE_PER_UID_PER_HOUR = 30;
const WO_APPROVE_DISPUTE_PER_UID_PER_HOUR = 20;
const DISPUTE_WINDOW_HOURS = 72;
const POINTS_WORK_ORDER_COMPLETE = 60;

type WOStatus = string;

const REQUester_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  DRAFT: ['REQUESTED', 'CANCELED'],
  REQUESTED: ['CANCELED'],
  CLARIFYING: ['REQUESTED', 'CANCELED'],
  ACCEPTED: ['CANCELED'],
  SCHEDULED: ['CANCELED'],
  EN_ROUTE: [],
  STARTED: [],
  MIDPOINT_PROOF: [],
  COMPLETED_PENDING_APPROVAL: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  DISPUTED: [],
  CANCELED: [],
};

const PARTNER_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  DRAFT: [],
  REQUESTED: ['CLARIFYING', 'ACCEPTED', 'CANCELED'],
  CLARIFYING: ['REQUESTED', 'ACCEPTED', 'CANCELED'],
  ACCEPTED: ['SCHEDULED', 'CANCELED'],
  SCHEDULED: ['EN_ROUTE', 'CANCELED'],
  EN_ROUTE: ['STARTED'],
  STARTED: ['MIDPOINT_PROOF', 'COMPLETED_PENDING_APPROVAL'],
  MIDPOINT_PROOF: ['STARTED', 'COMPLETED_PENDING_APPROVAL'],
  COMPLETED_PENDING_APPROVAL: [],
  COMPLETED: [],
  DISPUTED: [],
  CANCELED: [],
};

function canTransition(role: 'requester' | 'partner', from: WOStatus, to: WOStatus): boolean {
  const map = role === 'requester' ? REQUester_TRANSITIONS : PARTNER_TRANSITIONS;
  return (map[from] ?? []).includes(to);
}

async function auditWorkOrder(workOrderId: string, uid: string, action: string, fromStatus: string, toStatus: string, meta?: Record<string, unknown>): Promise<void> {
  await db.collection(WORK_ORDER_AUDIT).add({
    workOrderId,
    uid,
    action,
    fromStatus,
    toStatus,
    meta: meta || {},
    createdAt: Date.now(),
  });
}

/** Create work order. Customer only. */
export const createWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const category = typeof d?.category === 'string' ? d.category.trim() : 'other';
    const title = typeof d?.title === 'string' ? d.title.trim() : '';
    const description = typeof d?.description === 'string' ? d.description.trim() : '';
    const intakeTemplateId = typeof d?.intakeTemplateId === 'string' ? d.intakeTemplateId : undefined;
    const intakeAnswers = d?.intakeAnswers && typeof d.intakeAnswers === 'object' ? d.intakeAnswers as Record<string, string | number | boolean> : undefined;
    const cityId = typeof d?.cityId === 'string' ? d.cityId : undefined;

    if (!partnerId || !title) return { success: false, message: 'partnerId and title are required.' };

    try {
      await checkRateLimit(RATE_LIMIT_WORK_ORDER, `create_${safeId(uid)}`, 60 * 60 * 1000, WO_CREATE_PER_UID_PER_HOUR);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const id = `wo_${Date.now()}_${uid.slice(0, 8)}`;
    const now = Date.now();
    const wo = {
      id,
      cityId: cityId || null,
      requesterUid: uid,
      partnerId,
      category,
      title,
      description,
      intakeTemplateId: intakeTemplateId || null,
      intakeAnswers: intakeAnswers || {},
      mediaRefs: [],
      status: 'REQUESTED',
      schedule: {},
      milestones: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.collection(WORK_ORDERS).doc(id).set(wo);
    await auditWorkOrder(id, uid, 'create', 'DRAFT', 'REQUESTED', { title, category });
    return { success: true, workOrder: wo };
  });

/** Get single work order. */
export const getWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    if (!id) return { success: false, message: 'id required.' };
    const snap = await db.collection(WORK_ORDERS).doc(id).get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data();
    if (wo!.requesterUid !== uid && wo!.partnerId !== uid) return { success: false, message: 'Not authorized.' };
    return { success: true, workOrder: { id: snap.id, ...wo } };
  });

/** List work orders by role (customer | partner). */
export const listWorkOrders = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const role = (d?.role === 'partner') ? 'partner' : 'customer';
    const limit = Math.min(50, Math.max(1, Number(d?.limit) || 20));
    const field = role === 'customer' ? 'requesterUid' : 'partnerId';
    const snap = await db.collection(WORK_ORDERS).where(field, '==', uid).orderBy('updatedAt', 'desc').limit(limit).get();
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, workOrders: list };
  });

/** Partner: accept work order (optionally with proposed times). */
export const acceptWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const proposedTimes = Array.isArray(d?.proposedTimes) ? (d.proposedTimes as number[]).slice(0, 5) : undefined;
    if (!id) return { success: false, message: 'id required.' };
    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.partnerId !== uid) return { success: false, message: 'Not partner.' };
    if (!canTransition('partner', wo.status, 'ACCEPTED')) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    const updates: Record<string, unknown> = { status: 'ACCEPTED', updatedAt: now };
    if (proposedTimes?.length) updates['schedule.proposedTimes'] = proposedTimes;
    await ref.update(updates);
    await auditWorkOrder(id, uid, 'accept', wo.status, 'ACCEPTED');
    return { success: true, workOrder: { id, ...wo, ...updates } };
  });

/** Partner: clarify (move to CLARIFYING or back to REQUESTED with message). */
export const clarifyWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const message = typeof d?.message === 'string' ? d.message.trim() : '';
    if (!id) return { success: false, message: 'id required.' };
    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.partnerId !== uid) return { success: false, message: 'Not partner.' };
    const toStatus = wo.status === 'REQUESTED' ? 'CLARIFYING' : 'REQUESTED';
    if (!canTransition('partner', wo.status, toStatus)) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    await ref.update({ status: toStatus, updatedAt: now, lastClarifyMessage: message, lastClarifyAt: now });
    await auditWorkOrder(id, uid, 'clarify', wo.status, toStatus, { message });
    return { success: true };
  });

/** Partner: confirm schedule. */
export const scheduleWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const confirmedStartAt = typeof d?.confirmedStartAt === 'number' ? d.confirmedStartAt : undefined;
    const confirmedEndAt = typeof d?.confirmedEndAt === 'number' ? d.confirmedEndAt : undefined;
    if (!id) return { success: false, message: 'id required.' };
    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.partnerId !== uid) return { success: false, message: 'Not partner.' };
    if (!canTransition('partner', wo.status, 'SCHEDULED')) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    const schedule = (wo.schedule as Record<string, unknown>) || {};
    if (confirmedStartAt != null) schedule.confirmedStartAt = confirmedStartAt;
    if (confirmedEndAt != null) schedule.confirmedEndAt = confirmedEndAt;
    const milestones = Array.isArray(wo.milestones) ? [...wo.milestones] : [];
    milestones.push({ type: 'SCHEDULED', createdAt: now, completedAt: now });
    await ref.update({ status: 'SCHEDULED', schedule, milestones, updatedAt: now });
    await auditWorkOrder(id, uid, 'schedule', wo.status, 'SCHEDULED');
    return { success: true };
  });

/** Customer: cancel work order. Requester only. */
export const cancelWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    if (!id) return { success: false, message: 'id required.' };
    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.requesterUid !== uid) return { success: false, message: 'Only the customer who requested can cancel.' };
    if (!canTransition('requester', wo.status, 'CANCELED')) return { success: false, message: 'Cannot cancel from current status.' };
    const now = Date.now();
    await ref.update({ status: 'CANCELED', updatedAt: now });
    await auditWorkOrder(id, uid, 'cancel', wo.status, 'CANCELED');
    return { success: true };
  });

/** Partner: submit milestone (EN_ROUTE | STARTED | MIDPOINT_PROOF). Idempotent by clientNonce. */
export const submitMilestone = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const milestoneType = typeof d?.milestoneType === 'string' ? d.milestoneType : '';
    const clientNonce = typeof d?.clientNonce === 'string' ? d.clientNonce.trim() : '';
    const notes = typeof d?.notes === 'string' ? d.notes : undefined;
    const mediaRefs = Array.isArray(d?.mediaRefs) ? d.mediaRefs as string[] : undefined;
    if (!id || !milestoneType || !clientNonce) return { success: false, message: 'id, milestoneType, clientNonce required.' };
    const validTypes = ['EN_ROUTE', 'STARTED', 'MIDPOINT_PROOF'];
    if (!validTypes.includes(milestoneType)) return { success: false, message: 'Invalid milestoneType.' };

    try {
      await checkRateLimit(RATE_LIMIT_WORK_ORDER, `milestone_${safeId(uid)}`, 60 * 60 * 1000, WO_MILESTONE_PER_UID_PER_HOUR);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const idemKey = safeId(`milestone_${id}_${milestoneType}_${clientNonce}`);
    const idemRef = db.collection(EARN_IDEMPOTENCY).doc(idemKey);
    if ((await idemRef.get()).exists) return { success: true, idempotent: true };

    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.partnerId !== uid) return { success: false, message: 'Not partner.' };
    const statusMap: Record<string, WOStatus> = { EN_ROUTE: 'EN_ROUTE', STARTED: 'STARTED', MIDPOINT_PROOF: 'MIDPOINT_PROOF' };
    const toStatus = statusMap[milestoneType];
    if (!toStatus || !canTransition('partner', wo.status, toStatus)) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    const milestones = Array.isArray(wo.milestones) ? [...wo.milestones] : [];
    milestones.push({ type: milestoneType, createdAt: now, completedAt: now, notes, mediaRefs: mediaRefs || [] });
    await ref.update({ status: toStatus, milestones, updatedAt: now });
    await idemRef.set({ createdAt: now });
    await auditWorkOrder(id, uid, 'milestone', wo.status, toStatus, { milestoneType });
    return { success: true, workOrder: { id, ...wo, status: toStatus, milestones } };
  });

/** Partner: submit completion. -> COMPLETED_PENDING_APPROVAL. Idempotent. */
export const submitCompletion = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const clientNonce = typeof d?.clientNonce === 'string' ? d.clientNonce.trim() : '';
    const afterMediaRefs = Array.isArray(d?.afterMediaRefs) ? d.afterMediaRefs as string[] : [];
    const summaryLine = typeof d?.summaryLine === 'string' ? d.summaryLine.trim() : '';
    const checklistResults = d?.checklistResults && typeof d.checklistResults === 'object' ? d.checklistResults as Record<string, boolean> : undefined;
    if (!id || !clientNonce) return { success: false, message: 'id and clientNonce required.' };

    const idemKey = safeId(`complete_${id}_${clientNonce}`);
    const idemRef = db.collection(EARN_IDEMPOTENCY).doc(idemKey);
    if ((await idemRef.get()).exists) return { success: true, idempotent: true };

    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.partnerId !== uid) return { success: false, message: 'Not partner.' };
    if (!canTransition('partner', wo.status, 'COMPLETED_PENDING_APPROVAL')) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    const disputeWindowEndsAt = now + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000;
    const verificationLevel = afterMediaRefs.length >= 2 && summaryLine ? 'GOLD' : afterMediaRefs.length >= 1 ? 'SILVER' : 'BRONZE';
    const proofPackId = `pp_${id}_${now}`;
    const proofPack = {
      id: proofPackId,
      workOrderId: id,
      beforeMediaRefs: (wo.mediaRefs as string[]) || [],
      afterMediaRefs,
      timeline: { completedSubmittedAt: now },
      checklistResults: checklistResults || {},
      verificationLevel,
      disputeWindowEndsAt,
      createdAt: now,
    };
    const milestones = Array.isArray(wo.milestones) ? [...wo.milestones] : [];
    milestones.push({ type: 'COMPLETED_SUBMITTED', createdAt: now, completedAt: now });
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(idemRef, { createdAt: now });
      tx.update(ref, { status: 'COMPLETED_PENDING_APPROVAL', milestones, updatedAt: now });
      tx.set(db.collection(PROOF_PACKS).doc(proofPackId), proofPack);
    });
    await auditWorkOrder(id, uid, 'submitCompletion', wo.status, 'COMPLETED_PENDING_APPROVAL');
    return { success: true, proofPackId, disputeWindowEndsAt };
  });

/** Customer: approve -> COMPLETED, mint VerifiedAction + JobProofReceipt + ledger. Idempotent. */
export const approveWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const clientNonce = typeof d?.clientNonce === 'string' ? d.clientNonce.trim() : '';
    if (!id || !clientNonce) return { success: false, message: 'id and clientNonce required.' };

    try {
      await checkRateLimit(RATE_LIMIT_WORK_ORDER, `approve_${safeId(uid)}`, 60 * 60 * 1000, WO_APPROVE_DISPUTE_PER_UID_PER_HOUR);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const idemKey = safeId(`approve_${id}_${clientNonce}`);
    const idemRef = db.collection(EARN_IDEMPOTENCY).doc(idemKey);
    if ((await idemRef.get()).exists) {
      const existing = (await idemRef.get()).data();
      return { success: true, idempotent: true, actionId: existing?.actionId, receiptId: existing?.receiptId };
    }

    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.requesterUid !== uid) return { success: false, message: 'Not requester.' };
    if (!canTransition('requester', wo.status, 'COMPLETED')) return { success: false, message: 'Invalid transition.' };

    const proofSnap = await db.collection(PROOF_PACKS).where('workOrderId', '==', id).limit(1).get();
    const proofPack = proofSnap.empty ? null : proofSnap.docs[0].data();
    const verificationLevel = (proofPack?.verificationLevel as string) || 'BRONZE';
    const now = Date.now();
    const actionId = `va_wo_${now}_${uid.slice(0, 8)}`;
    const receiptId = `jpr_${id}_${now}`;
    const summaryLine = (proofPack?.summaryLine as string) || (wo.title as string) || 'Job completed';
    const partnerSnap = await db.collection('partners').doc(wo.partnerId).get();
    const partnerName = (partnerSnap.data()?.name as string) || wo.partnerId;

    const milestones = Array.isArray(wo.milestones) ? [...wo.milestones] : [];
    milestones.push({ type: 'APPROVED', createdAt: now, completedAt: now });
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(idemRef, { actionId, receiptId, createdAt: now });
      tx.update(ref, { status: 'COMPLETED', updatedAt: now, milestones });
      if (!proofSnap.empty) {
        tx.update(db.collection(PROOF_PACKS).doc(proofSnap.docs[0].id), {
          'customerApproval.approvedAt': now,
          'customerApproval.method': 'TAP_APPROVE',
          'timeline.approvedAt': now,
        });
      }
      tx.set(db.collection(VERIFIED_ACTIONS).doc(actionId), {
        id: actionId,
        uid: wo.requesterUid,
        partnerId: wo.partnerId,
        perkId: id,
        refType: 'workOrder',
        refId: id,
        reasonCode: 'EMIT_WORK_ORDER_COMPLETE',
        pointsAwarded: POINTS_WORK_ORDER_COMPLETE,
        actionType: 'WORK_ORDER_COMPLETE',
        createdAt: now,
      });
      const ledgerRef = db.collection(LEDGERS).doc(wo.requesterUid);
      const ledgerSnap = await tx.get(ledgerRef);
      const balance = (ledgerSnap.data()?.balance as number) ?? 0;
      const newBalance = balance + POINTS_WORK_ORDER_COMPLETE;
      tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
      tx.set(ledgerRef.collection('entries').doc(), {
        type: 'earn',
        amount: POINTS_WORK_ORDER_COMPLETE,
        reason: 'EMIT_WORK_ORDER_COMPLETE',
        ref: { actionId, partnerId: wo.partnerId, workOrderId: id },
        createdAt: now,
      });
      tx.set(db.collection(JOB_PROOF_RECEIPTS).doc(receiptId), {
        id: receiptId,
        workOrderId: id,
        partnerId: wo.partnerId,
        requesterUid: wo.requesterUid,
        category: wo.category,
        summaryLine,
        completedAt: now,
        verificationLevel,
        deepLinkTarget: `/proof/${receiptId}`,
        shareCardSpec: { partnerName, category: wo.category, summaryLine, completedAt: now, verificationLevel },
      });
      const portRef = db.collection(PARTNER_PROOF_PORTFOLIOS).doc(wo.partnerId);
      const portSnap = await tx.get(portRef);
      const port = portSnap.data() || { partnerId: wo.partnerId, verifiedJobs30d: 0, verifiedJobs90d: 0, categoriesTop: [] };
      const verified30 = (port.verifiedJobs30d as number) + 1;
      const verified90 = (port.verifiedJobs90d as number) + 1;
      tx.set(portRef, { ...port, verifiedJobs30d: verified30, verifiedJobs90d: verified90, updatedAt: now }, { merge: true });
    });

    await auditWorkOrder(id, uid, 'approve', wo.status, 'COMPLETED');
    return { success: true, actionId, receiptId, pointsAwarded: POINTS_WORK_ORDER_COMPLETE };
  });

/** Customer: dispute. */
export const disputeWorkOrder = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const id = typeof d?.id === 'string' ? d.id.trim() : '';
    const reason = typeof d?.reason === 'string' ? d.reason.trim() : '';
    if (!id) return { success: false, message: 'id required.' };

    try {
      await checkRateLimit(RATE_LIMIT_WORK_ORDER, `dispute_${safeId(uid)}`, 60 * 60 * 1000, WO_APPROVE_DISPUTE_PER_UID_PER_HOUR);
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Rate limit exceeded.' };
    }

    const ref = db.collection(WORK_ORDERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Work order not found.' };
    const wo = snap.data()!;
    if (wo.requesterUid !== uid) return { success: false, message: 'Not requester.' };
    if (!canTransition('requester', wo.status, 'DISPUTED')) return { success: false, message: 'Invalid transition.' };
    const now = Date.now();
    await ref.update({ status: 'DISPUTED', updatedAt: now, disputeReason: reason, disputedAt: now });
    await recordIntegrityEvent('WORK_ORDER_DISPUTE', uid, { workOrderId: id, reason }, wo.partnerId);
    await auditWorkOrder(id, uid, 'dispute', wo.status, 'DISPUTED', { reason });
    return { success: true };
  });

/** Get partner Proof Portfolio. */
export const getPartnerProofPortfolio = functions
  .region('us-central1')
  .https.onCall(async (data: unknown) => {
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    if (!partnerId) return { success: false, message: 'partnerId required.' };
    const snap = await db.collection(PARTNER_PROOF_PORTFOLIOS).doc(partnerId).get();
    const port = snap.data() || { partnerId, verifiedJobs30d: 0, verifiedJobs90d: 0, categoriesTop: [], featuredProofTiles: [] };
    return { success: true, portfolio: port };
  });

// ========== PARTNER REFERRAL BONUS ==========
const PARTNER_APPLICATIONS = 'partnerApplications';
const PARTNER_REFERRAL_BONUS_POINTS = 100;

/** When a partner application is approved and has a referrer, award 100 OT to both. */
export const onPartnerApplicationUpdated = functions
  .region('us-central1')
  .firestore.document(`${PARTNER_APPLICATIONS}/{docId}`)
  .onUpdate(async (change: functions.Change<admin.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
    const before = change.before.data();
    const after = change.after.data();
    const docId = context.params.docId as string;

    if (after.status !== 'approved' || before.status === 'approved') return;
    const referredByCode = (after.referredByCode as string) || '';
    if (!referredByCode.trim()) return;
    if (after.partnerReferralBonusAwarded === true) return;

    const refereeUid = (after.userId as string) || null;
    let referrerUid: string | null = null;
    const referrerAppSnap = await db.collection(PARTNER_APPLICATIONS).doc(referredByCode.trim()).get();
    if (referrerAppSnap.exists) {
      referrerUid = (referrerAppSnap.data()?.userId as string) || null;
    }

    const uidsToCredit: string[] = [];
    if (refereeUid) uidsToCredit.push(refereeUid);
    if (referrerUid) uidsToCredit.push(referrerUid);
    if (uidsToCredit.length === 0) return;

    const now = Date.now();
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      for (const uid of uidsToCredit) {
        const ledgerRef = db.collection(LEDGERS).doc(uid);
        const ledgerSnap = await tx.get(ledgerRef);
        const balance = (ledgerSnap.data()?.balance as number) ?? 0;
        const newBalance = balance + PARTNER_REFERRAL_BONUS_POINTS;
        tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
        tx.set(ledgerRef.collection('entries').doc(), {
          type: 'earn',
          amount: PARTNER_REFERRAL_BONUS_POINTS,
          reason: 'PARTNER_REFERRAL_BONUS',
          ref: { applicationId: docId, referredByCode: referredByCode.trim() },
          createdAt: now,
        });
      }
      tx.update(change.after.ref, { partnerReferralBonusAwarded: true });
    });
  });

/** Admin: list partner applications (pending, approved, rejected). */
export const listPartnerApplicationsAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const statusFilter = d?.status === 'pending' || d?.status === 'approved' || d?.status === 'rejected' ? d.status : undefined;
    const limit = Math.min(100, Math.max(10, typeof d?.limit === 'number' ? d.limit : 50));
    const snap = await db.collection(PARTNER_APPLICATIONS).orderBy('createdAt', 'desc').limit(limit * 2).get();
    let docs = snap.docs;
    if (statusFilter) docs = docs.filter((doc) => doc.data().status === statusFilter).slice(0, limit);
    else docs = docs.slice(0, limit);
    const applications = docs.map((doc) => {
      const x = doc.data();
      const ts = x.createdAt as admin.firestore.Timestamp | undefined;
      const updatedTs = x.updatedAt as admin.firestore.Timestamp | undefined;
      return {
        id: doc.id,
        businessName: x.businessName ?? '',
        contactName: x.contactName ?? '',
        contactEmail: x.contactEmail ?? '',
        category: x.category ?? null,
        description: x.description ?? '',
        placementInterest: x.placementInterest ?? 'both',
        referredByCode: x.referredByCode ?? null,
        adPlacementPreference: x.adPlacementPreference ?? null,
        adCtaUrl: x.adCtaUrl ?? null,
        adCreativeType: x.adCreativeType ?? null,
        adNotes: x.adNotes ?? null,
        status: x.status ?? 'pending',
        adminNote: x.adminNote ?? null,
        createdAt: ts?.toMillis?.() ?? 0,
        updatedAt: updatedTs?.toMillis?.() ?? 0,
      };
    });
    return { success: true, applications };
  });

/** Admin: approve or reject a partner application. */
export const updatePartnerApplicationStatus = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const applicationId = typeof d?.applicationId === 'string' ? d.applicationId.trim() : '';
    const status = d?.status === 'approved' || d?.status === 'rejected' ? d.status : '';
    const adminNote = typeof d?.adminNote === 'string' ? d.adminNote.trim().slice(0, 500) : null;
    if (!applicationId) return { success: false, message: 'applicationId is required.' };
    if (!status) return { success: false, message: 'status must be approved or rejected.' };
    const ref = db.collection(PARTNER_APPLICATIONS).doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Application not found.' };
    const current = snap.data()?.status;
    if (current === status) return { success: true, message: 'Already in that status.' };
    await ref.update({
      status,
      adminNote: adminNote ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    });
    return { success: true, message: `Application ${status}.` };
  });

const USERS = 'users';

/** Admin: approve application (if pending) and create partner from application, link to user. Idempotent. */
export const createPartnerFromApplication = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const applicationId = typeof (data as Record<string, unknown>)?.applicationId === 'string' ? (data as Record<string, unknown>).applicationId as string : '';
    if (!applicationId.trim()) return { success: false, message: 'applicationId is required.' };

    const appRef = db.collection(PARTNER_APPLICATIONS).doc(applicationId.trim());
    const appSnap = await appRef.get();
    if (!appSnap.exists) return { success: false, message: 'Application not found.' };
    const appData = appSnap.data()!;
    const existingPartnerId = appData.partnerIdCreated as string | undefined;
    if (existingPartnerId) return { success: true, message: 'Partner already created.', partnerId: existingPartnerId };

    const status = (appData.status as string) || 'pending';
    if (status !== 'approved') {
      await appRef.update({
        status: 'approved',
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid,
      });
    }

    const businessName = (appData.businessName as string) || 'New Partner';
    const category = typeof appData.category === 'string' && appData.category.trim() ? (appData.category as string).trim() : 'Other';
    const description = typeof appData.description === 'string' ? (appData.description as string).trim() : '';
    const userId = (appData.userId as string) || null;

    const partnerId = `p_app_${applicationId.trim()}`;
    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (partnerSnap.exists) {
      await appRef.update({ partnerIdCreated: partnerId });
      return { success: true, message: 'Partner already exists.', partnerId };
    }

    const partnerPayload: Record<string, unknown> = {
      id: partnerId,
      name: businessName,
      category,
      tier: 'silver',
      location: { lat: 0, lng: 0, address: '' },
      description,
      hours: '',
      verified: false,
      termsShort: null,
      featuredImageUrl: null,
      logoUrl: null,
      about: null,
      showOrbOpsButton: true,
      offersCatering: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (userId) (partnerPayload as Record<string, unknown>).ownerUid = userId;
    await partnerRef.set(partnerPayload);

    if (userId) {
      const userRef = db.collection(USERS).doc(userId);
      await userRef.set({ partnerId }, { merge: true });
    }

    await appRef.update({ partnerIdCreated: partnerId });
    return { success: true, message: 'Partner created. They can now add perks from the dashboard.', partnerId };
  });

// ========== USER REFERRAL BONUS ==========
const USER_REFERRAL_BONUS_POINTS = 50;

/** When a new user doc has referredBy set (invite link), award 50 OT to both referrer and referee. */
export const onUserReferralWritten = functions
  .region('us-central1')
  .firestore.document('users/{uid}')
  .onUpdate(async (change: functions.Change<admin.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
    const after = change.after.data();
    const refereeUid = context.params.uid as string;
    const referrerUid = (after.referredBy as string) || '';
    if (!referrerUid.trim() || referrerUid === refereeUid) return;
    if (after.userReferralBonusAwarded === true) return;

    const now = Date.now();
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      for (const uid of [refereeUid, referrerUid]) {
        const ledgerRef = db.collection(LEDGERS).doc(uid);
        const ledgerSnap = await tx.get(ledgerRef);
        const balance = (ledgerSnap.data()?.balance as number) ?? 0;
        const newBalance = balance + USER_REFERRAL_BONUS_POINTS;
        tx.set(ledgerRef, { balance: newBalance, updatedAt: now }, { merge: true });
        tx.set(ledgerRef.collection('entries').doc(), {
          type: 'earn',
          amount: USER_REFERRAL_BONUS_POINTS,
          reason: 'USER_REFERRAL_BONUS',
          ref: { refereeUid, referrerUid },
          createdAt: now,
        });
      }
      tx.update(change.after.ref, { userReferralBonusAwarded: true });
    });
  });

// Super Admin global announcements — only admin emails can create
const GLOBAL_ANNOUNCEMENTS = 'globalAnnouncements';
const ADMIN_EMAILS = ['ahoddd@icloud.com'];

export const createGlobalAnnouncement = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 30 })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Only OrbTap Super Admin can send global messages.' };
    }
    const d = data as Record<string, unknown> | null | undefined;
    const title = typeof d?.title === 'string' ? d.title.trim().slice(0, 120) : '';
    const body = typeof d?.body === 'string' ? d.body.trim().slice(0, 2000) : '';
    const targetAudience = d?.targetAudience === 'partners' ? 'partners' : d?.targetAudience === 'members' ? 'members' : d?.targetAudience === 'specific' ? 'specific' : 'all';
    const displayType = d?.displayType === 'banner' ? 'banner' : 'bulletin';
    const imageUrl = typeof d?.imageUrl === 'string' ? d.imageUrl.trim().slice(0, 500) : '';
    const rawPartners = Array.isArray(d?.taggedPartnerIds) ? d.taggedPartnerIds : [];
    const rawUsers = Array.isArray(d?.taggedUserIds) ? d.taggedUserIds : [];
    const taggedPartnerIds = rawPartners.filter((id): id is string => typeof id === 'string').slice(0, 20);
    const taggedUserIds = rawUsers.filter((id): id is string => typeof id === 'string').slice(0, 20);
    if (!title) return { success: false, message: 'Title is required.' };
    const ref = db.collection(GLOBAL_ANNOUNCEMENTS).doc();
    await ref.set({
      title,
      body,
      targetAudience,
      displayType,
      imageUrl: imageUrl || null,
      taggedPartnerIds: taggedPartnerIds.length ? taggedPartnerIds : null,
      taggedUserIds: taggedUserIds.length ? taggedUserIds : null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      active: true,
    });
    return { success: true, id: ref.id };
  });

// ========== PUSH NOTIFICATIONS ==========
// Copy guidelines: calm, professional, useful. No hype or "Vote now!"-style pressure.
// Titles: short, factual (e.g. "New from {partner}", "A new poll is open"). Bodies: one line, value-focused.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CONFIG_COLLECTION = 'config';
const PUSH_CONFIG_DOC = 'push';
const FOLLOWS_PARTNERS = 'followsPartners';
const POSTS_COLLECTION = 'posts';

async function getPushConfig(): Promise<{ pollPushEnabled: boolean; deadlineReminderEnabled: boolean; stampReminderEnabled: boolean }> {
  const ref = db.collection(PUSH_CONFIG_COLLECTION).doc(PUSH_CONFIG_DOC);
  const snap = await ref.get();
  const data = snap.data();
  return {
    pollPushEnabled: data?.pollPushEnabled !== false,
    deadlineReminderEnabled: data?.deadlineReminderEnabled !== false,
    stampReminderEnabled: data?.stampReminderEnabled !== false,
  };
}

/** Get all user IDs that follow the given partner (for follower-targeted notifications). */
async function getFollowerUidsForPartner(partnerId: string): Promise<string[]> {
  if (!partnerId) return [];
  const snap = await db.collectionGroup(FOLLOWS_PARTNERS).where('partnerId', '==', partnerId).get();
  const uids: string[] = [];
  snap.docs.forEach((d) => {
    const uid = d.ref.parent?.parent?.id;
    if (uid && typeof uid === 'string') uids.push(uid);
  });
  return [...new Set(uids)];
}

/** Create in-app notification and optionally send push. Respects user notification prefs. */
async function sendInAppAndPushToUsers(
  uids: string[],
  payload: { type: string; title: string; body: string; data: Record<string, string> },
  options: { pushPrefKey?: string; allowPush?: (prefs: Record<string, unknown>) => boolean } = {}
): Promise<void> {
  const { pushPrefKey, allowPush } = options;
  const defaultAllowPush = (prefs: Record<string, unknown>) => prefs?.pushEnabled !== false && (pushPrefKey ? prefs[pushPrefKey] !== false : true);
  const canPush = allowPush ?? (pushPrefKey ? (p: Record<string, unknown>) => defaultAllowPush(p) : defaultAllowPush);

  for (const uid of uids.slice(0, 5000)) {
    const notifRef = db.collection('users').doc(uid).collection('notifications').doc();
    await notifRef.set({
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      read: false,
      deletedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    const prefsSnap = await db.collection('users').doc(uid).collection('private').doc('notificationPreferences').get();
    const prefs = (prefsSnap.data() || {}) as Record<string, unknown>;
    if (!canPush(prefs)) continue;

    const tokensSnap = await db.collection('users').doc(uid).collection('devicePushTokens').get();
    const tokens: string[] = [];
    tokensSnap.docs.forEach((t) => {
      const expoToken = t.data()?.expoPushToken;
      if (expoToken && typeof expoToken === 'string' && expoToken.startsWith('ExponentPushToken')) tokens.push(expoToken);
    });
    if (tokens.length === 0) continue;

    const messages = tokens.slice(0, 3).map((to) => ({
      to,
      title: payload.title,
      body: (payload.body || '').slice(0, 180),
      data: payload.data,
      sound: 'default' as const,
      channelId: 'default',
    }));
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
    } catch (e) {
      console.warn('Push send error', e);
    }
  }
}

/** When a partner publishes a new OrbFeed post, notify their followers (who have partner updates on). */
export const onPostCreated = functions
  .region('us-central1')
  .firestore.document(`${POSTS_COLLECTION}/{postId}`)
  .onCreate(async (snap: admin.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data();
    const partnerId = (data?.partnerId as string) || '';
    const partnerName = (data?.partnerName as string)?.trim?.() || 'A partner';
    const title = (data?.title as string)?.trim?.()?.slice(0, 60) || 'New post';
    const postId = context.params.postId as string;
    if (!partnerId) return;

    const followerUids = await getFollowerUidsForPartner(partnerId);
    if (followerUids.length === 0) return;

    await sendInAppAndPushToUsers(
      followerUids,
      {
        type: 'partner_post',
        title: `New from ${partnerName}`,
        body: (title || 'Something new for you').slice(0, 120),
        data: { url: `/feed/${postId}`.replace(/\/feed\/$/, '/feed'), postId, partnerId },
      },
      { pushPrefKey: 'partnerUpdates' }
    );
  });

const LEADERBOARD_EXPLORERS = 'leaderboardExplorers';

/** When a user earns a verified action (check-in, redeem, etc.), notify their friends and update leaderboard. */
export const onVerifiedActionCreated = functions
  .region('us-central1')
  .firestore.document(`${VERIFIED_ACTIONS}/{actionId}`)
  .onCreate(async (snap: admin.firestore.DocumentSnapshot) => {
    const data = snap.data();
    const uid = (data?.uid as string) || '';
    const partnerId = (data?.partnerId as string) || '';
    const pointsAwarded = (data?.pointsAwarded as number) || 0;
    const actionId = snap.id;
    if (!uid) return;

    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data() || {};
    const displayName = (userData.displayName as string)?.trim?.() || (userData.email as string)?.split?.('@')?.[0] || 'Explorer';
    const xp = typeof userData.xp === 'number' ? userData.xp : pointsAwarded;
    await db.collection(LEADERBOARD_EXPLORERS).doc(uid).set(
      { userId: uid, displayName, xp, updatedAt: Date.now() },
      { merge: true }
    );

    const friendUids = await getFriendUids(uid);
    if (friendUids.length === 0) return;

    const partnerSnap = partnerId ? await db.collection(PARTNERS).doc(partnerId).get() : null;
    const partnerName = partnerSnap?.exists ? (partnerSnap.data()?.name as string)?.trim?.() : null;
    const verb = partnerName ? 'checked in' : 'earned OT';
    const where = partnerName ? ` at ${partnerName}` : '';
    const body = partnerName
      ? `${displayName} checked in at ${partnerName} · +${pointsAwarded} OT`
      : `${displayName} earned ${pointsAwarded} OT`;

    await sendInAppAndPushToUsers(
      friendUids,
      {
        type: 'friend_activity',
        title: `${displayName} ${verb}${where}`,
        body,
        data: { url: '/feed', actionId, actorUid: uid, partnerId: partnerId || '' },
      },
      { pushPrefKey: 'friendActivity' }
    );
  });

/** When a user places an Orb Signal forecast, notify their friends to drive engagement. */
export const onOrbSignalForecastCreated = functions
  .region('us-central1')
  .firestore.document('orbsignalForecasts/{forecastId}')
  .onCreate(async (snap: admin.firestore.DocumentSnapshot) => {
    const data = snap.data();
    const userId = (data?.userId as string) || '';
    const marketQuestion = (data?.marketQuestion as string)?.trim?.()?.slice(0, 60) || 'a market';
    const forecastId = snap.id;
    if (!userId) return;

    const friendUids = await getFriendUids(userId);
    if (friendUids.length === 0) return;

    const userSnap = await db.collection('users').doc(userId).get();
    const displayName = (userSnap.data()?.displayName as string)?.trim?.() || (userSnap.data()?.email as string)?.split?.('@')?.[0] || 'Someone';

    await sendInAppAndPushToUsers(
      friendUids,
      {
        type: 'friend_orbsignal',
        title: `${displayName} made a prediction`,
        body: (marketQuestion || 'See predictions on Orb Signal').slice(0, 100),
        data: { url: '/orbsignal', forecastId, actorUid: userId },
      },
      { pushPrefKey: 'friendActivity' }
    );
  });

/** When a new poll is created: (1) notify followers of the poll's partner; (2) broadcast to users with polls on. */
export const onPollCreated = functions
  .region('us-central1')
  .firestore.document('polls/{pollId}')
  .onCreate(async (snap: admin.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data();
    const question = (data?.question as string)?.trim?.()?.slice(0, 80) || 'New poll';
    const pollId = context.params.pollId as string;
    const partnerId = (data?.partnerId as string) || '';
    const partnerName = (data?.partnerName as string)?.trim?.() || 'A partner';

    if (partnerId) {
      const followerUids = await getFollowerUidsForPartner(partnerId);
      if (followerUids.length > 0) {
        await sendInAppAndPushToUsers(
          followerUids,
          {
            type: 'partner_poll',
            title: `New poll from ${partnerName}`,
            body: (question || 'Your vote counts').slice(0, 120),
            data: { url: '/vote', pollId, partnerId },
          },
          { pushPrefKey: 'partnerUpdates' }
        );
      }
    }

    const config = await getPushConfig();
    if (!config.pollPushEnabled) return;

    const tokens: string[] = [];
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      const prefsSnap = await userDoc.ref.collection('private').doc('notificationPreferences').get();
      const prefs = prefsSnap.data();
      if (prefs?.pushEnabled === false || prefs?.polls === false) continue;

      const tokensSnap = await userDoc.ref.collection('devicePushTokens').get();
      tokensSnap.docs.forEach((t) => {
        const expoToken = t.data()?.expoPushToken;
        if (expoToken && typeof expoToken === 'string' && expoToken.startsWith('ExponentPushToken')) {
          tokens.push(expoToken);
        }
      });
    }

    if (tokens.length === 0) return;

    const CHUNK = 100;
    for (let i = 0; i < tokens.length; i += CHUNK) {
      const chunk = tokens.slice(i, i + CHUNK);
      const messages = chunk.map((to) => ({
        to,
        title: 'A new poll is open',
        body: (question || 'Your vote counts').slice(0, 120),
        data: { url: '/vote', pollId },
        sound: 'default',
        channelId: 'default',
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });
        if (!res.ok) {
          console.warn('Poll push send failed:', res.status, await res.text());
        }
      } catch (e) {
        console.warn('Poll push error:', e);
      }
    }
  });

/** Admin: set push config (poll push, deadline reminder). */
export const setPushConfig = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const d = data as Record<string, unknown> | null | undefined;
    const pollPushEnabled = d?.pollPushEnabled !== false;
    const deadlineReminderEnabled = d?.deadlineReminderEnabled !== false;
    const stampReminderEnabled = d?.stampReminderEnabled !== false;
    await db.collection(PUSH_CONFIG_COLLECTION).doc(PUSH_CONFIG_DOC).set(
      { pollPushEnabled, deadlineReminderEnabled, stampReminderEnabled, updatedAt: FieldValue.serverTimestamp(), updatedBy: context.auth.uid },
      { merge: true }
    );
    return { success: true };
  });

/** Admin: get current push config. */
export const getPushConfigCallable = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const config = await getPushConfig();
    return { success: true, config };
  });

/** Admin: send a test push to the current user's device. */
export const sendTestPush = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const tokensSnap = await db.collection('users').doc(uid).collection('devicePushTokens').get();
    const tokens: string[] = [];
    tokensSnap.docs.forEach((t) => {
      const expoToken = t.data()?.expoPushToken;
      if (expoToken && typeof expoToken === 'string' && expoToken.startsWith('ExponentPushToken')) {
        tokens.push(expoToken);
      }
    });
    if (tokens.length === 0) {
      return { success: false, message: 'No push token found. Open the app on a device and ensure notifications are enabled.' };
    }
    const messages = tokens.slice(0, 5).map((to) => ({
      to,
      title: 'OrbTap',
      body: "You're all set — push notifications are working.",
      data: { url: '/vote' },
      sound: 'default',
      channelId: 'default',
    }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      return { success: false, message: `Expo API error: ${res.status}` };
    }
    return { success: true, message: `Sent to ${messages.length} device(s).` };
  });

// ========== ORB SIGNAL FORECASTS (admin list + delete with owner notification) ==========
const ORBSIGNAL_FORECASTS = 'orbsignalForecasts';

export const listOrbSignalForecasts = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth!.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const snap = await db.collection(ORBSIGNAL_FORECASTS).orderBy('createdAt', 'desc').limit(500).get();
    const forecasts = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt as admin.firestore.Timestamp | undefined;
      return {
        id: d.id,
        userId: data.userId,
        marketId: data.marketId,
        outcomeIndex: data.outcomeIndex,
        outcomeLabel: data.outcomeLabel,
        amount: data.amount,
        marketQuestion: data.marketQuestion,
        createdAt: ts?.toMillis?.() ?? 0,
      };
    });
    return { success: true, forecasts };
  });

export const deleteOrbSignalForecast = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth!.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const d = data as { forecastId?: string; reason?: string } | null | undefined;
    const forecastId = typeof d?.forecastId === 'string' ? d.forecastId.trim() : '';
    const reason = typeof d?.reason === 'string' ? d.reason.trim().slice(0, 500) : undefined;
    if (!forecastId) return { success: false, message: 'forecastId is required.' };

    const ref = db.collection(ORBSIGNAL_FORECASTS).doc(forecastId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Forecast not found.' };
    const fd = snap.data()!;
    const userId = fd.userId as string;
    const marketQuestion = (fd.marketQuestion as string) || 'A prediction';
    await ref.delete();

    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    await notifRef.set({
      type: 'forecast_deleted',
      title: 'Orb Signal forecast removed',
      body: reason ? `Your forecast on "${marketQuestion}" was removed. Reason: ${reason}` : `Your forecast on "${marketQuestion}" was removed by OrbTap.`,
      reason: reason || null,
      read: false,
      deletedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      data: { screen: 'orbsignal', forecastId },
    });

    const prefsSnap = await db.collection('users').doc(userId).collection('private').doc('notificationPreferences').get();
    const prefs = prefsSnap.data();
    if (prefs?.pushEnabled !== false && prefs?.orbsignalAlerts !== false) {
      const tokensSnap = await db.collection('users').doc(userId).collection('devicePushTokens').get();
      const tokens: string[] = [];
      tokensSnap.docs.forEach((t) => {
        const expoToken = t.data()?.expoPushToken;
        if (expoToken && typeof expoToken === 'string' && expoToken.startsWith('ExponentPushToken')) tokens.push(expoToken);
      });
      if (tokens.length > 0) {
        const body = reason
          ? `Update about your forecast: ${reason.slice(0, 80)}`
          : 'An update about your Orb Signal forecast.';
        await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(tokens.slice(0, 10).map((to) => ({ to, title: 'Orb Signal', body, data: { url: '/orbsignal' }, sound: 'default', channelId: 'default' }))),
        }).catch((e) => console.warn('Forecast-deleted push error', e));
      }
    }
    return { success: true };
  });

// ========== USER NOTIFICATIONS (admin send in-app + optional push) ==========
export const createUserNotifications = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth!.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const d = data as { targetUserIds?: string[]; title?: string; body?: string; type?: string; data?: Record<string, string>; alsoPush?: boolean } | null | undefined;
    const targetUserIds = Array.isArray(d?.targetUserIds) ? (d.targetUserIds as string[]).filter((id) => typeof id === 'string').slice(0, 5000) : [];
    const title = typeof d?.title === 'string' ? d.title.trim().slice(0, 120) : '';
    const body = typeof d?.body === 'string' ? d.body.trim().slice(0, 2000) : '';
    const type = typeof d?.type === 'string' ? d.type.slice(0, 32) : 'general';
    const payloadData = d?.data && typeof d.data === 'object' ? d.data : {};
    const alsoPush = d?.alsoPush === true;
    if (!title) return { success: false, message: 'Title is required.' };
    if (targetUserIds.length === 0) return { success: false, message: 'At least one target user is required.' };

    let created = 0;
    for (const uid of targetUserIds) {
      const notifRef = db.collection('users').doc(uid).collection('notifications').doc();
      await notifRef.set({
        type,
        title,
        body,
        data: payloadData,
        read: false,
        deletedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        fromUserId: context.auth.uid,
      });
      created++;
      if (alsoPush) {
        const prefsSnap = await db.collection('users').doc(uid).collection('private').doc('notificationPreferences').get();
        const prefs = prefsSnap.data();
        if (prefs?.pushEnabled !== false) {
          const tokensSnap = await db.collection('users').doc(uid).collection('devicePushTokens').get();
          tokensSnap.docs.slice(0, 3).forEach((t) => {
            const expoToken = t.data()?.expoPushToken;
            if (expoToken && typeof expoToken === 'string' && expoToken.startsWith('ExponentPushToken')) {
              fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify([{ to: expoToken, title, body: body.slice(0, 180), data: payloadData, sound: 'default', channelId: 'default' }]),
              }).catch((e) => console.warn('Admin notification push error', e));
            }
          });
        }
      }
    }
    return { success: true, count: created };
  });

// ========== BADGE DEFINITIONS (admin-created badges) ==========
const BADGE_DEFINITIONS = 'badgeDefinitions';

export const createBadgeDefinition = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const d = data as Record<string, unknown> | null | undefined;
    const name = typeof d?.name === 'string' ? d.name.trim().slice(0, 80) : '';
    const description = typeof d?.description === 'string' ? d.description.trim().slice(0, 300) : '';
    const icon = typeof d?.icon === 'string' ? d.icon.trim().slice(0, 40) : 'ribbon';
    const color = typeof d?.color === 'string' ? d.color.trim().slice(0, 20) : '#60A5FA';
    const category = typeof d?.category === 'string' ? d.category.trim().slice(0, 20) : 'one_time';
    const order = typeof d?.order === 'number' ? Math.round(d.order) : 999;
    const requirementType = d?.requirementType === 'verified_actions' || d?.requirementType === 'min_level' || d?.requirementType === 'min_ot_spent' || d?.requirementType === 'manual' ? d.requirementType : 'manual';
    const reqConfig = d?.requirementConfig && typeof d.requirementConfig === 'object' ? d.requirementConfig as Record<string, unknown> : undefined;
    const actionTypes = Array.isArray(reqConfig?.actionTypes) ? (reqConfig.actionTypes as string[]).filter((x) => typeof x === 'string').slice(0, 20) : undefined;
    const count = typeof reqConfig?.count === 'number' ? Math.max(0, Math.round(reqConfig.count)) : undefined;
    const minLevel = typeof reqConfig?.minLevel === 'number' ? Math.max(0, Math.round(reqConfig.minLevel)) : undefined;
    const minOtSpent = typeof reqConfig?.minOtSpent === 'number' ? Math.max(0, Math.round(reqConfig.minOtSpent)) : undefined;
    if (!name) return { success: false, message: 'Name is required.' };
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const ref = db.collection(BADGE_DEFINITIONS).doc(id);
    await ref.set({
      name,
      description,
      icon,
      color,
      category,
      order,
      requirementType,
      requirementConfig: requirementType === 'verified_actions' && (actionTypes?.length || count != null) ? { actionTypes: actionTypes ?? [], count: count ?? 1 } : requirementType === 'min_level' && minLevel != null ? { minLevel } : requirementType === 'min_ot_spent' && minOtSpent != null ? { minOtSpent } : null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
    return { success: true, id };
  });

export const listBadgeDefinitions = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const snap = await db.collection(BADGE_DEFINITIONS).orderBy('order', 'asc').get();
    const badges = snap.docs.map((doc) => {
      const data = doc.data();
      const ts = data.createdAt as admin.firestore.Timestamp | undefined;
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        category: data.category,
        order: data.order,
        requirementType: data.requirementType,
        requirementConfig: data.requirementConfig,
        createdAt: ts?.toMillis?.() ?? 0,
        createdBy: data.createdBy,
      };
    });
    return { success: true, badges };
  });

/** Evaluate custom badge requirements for a user and award newly earned badges. Callable by user (self) or admin (any uid). */
export const evaluateUserBadges = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const auth = context.auth;
    const d = data as Record<string, unknown> | null | undefined;
    const requestedUid = typeof d?.uid === 'string' ? d.uid.trim() : '';
    const email = (auth.token?.email as string)?.toLowerCase?.() || '';
    const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === email);
    const targetUid = requestedUid && isAdmin ? requestedUid : auth.uid;
    if (!targetUid) return { success: false, message: 'Invalid user.' };

    const userRef = db.collection('users').doc(targetUid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};
    const existingBadges: string[] = Array.isArray(userData.badges) ? userData.badges : [];

    const actionsSnap = await db.collection(VERIFIED_ACTIONS).where('uid', '==', targetUid).get();
    const actionCountByReason: Record<string, number> = {};
    let totalXpFromActions = 0;
    actionsSnap.docs.forEach((doc) => {
      const d = doc.data();
      const reason = (d.reasonCode as string) || 'EMIT_VERIFIED_REDEEM';
      actionCountByReason[reason] = (actionCountByReason[reason] || 0) + 1;
      totalXpFromActions += (d.pointsAwarded as number) || 0;
    });

    const entriesSnap = await db.collection(LEDGERS).doc(targetUid).collection('entries').get();
    let totalSpent = 0;
    entriesSnap.docs.forEach((doc) => {
      const d = doc.data();
      if (d.type === 'spend') totalSpent += Math.max(0, (d.amount as number) || 0);
    });

    const userXp = typeof userData.xp === 'number' ? userData.xp : totalXpFromActions;
    const LEVEL_TIERS = [
      { level: 1, xpRequired: 0 },
      { level: 2, xpRequired: 500 },
      { level: 3, xpRequired: 1500 },
      { level: 4, xpRequired: 3000 },
      { level: 5, xpRequired: 5000 },
      { level: 6, xpRequired: 10000 },
      { level: 7, xpRequired: 25000 },
    ];
    let userLevel = 1;
    for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
      if (userXp >= LEVEL_TIERS[i].xpRequired) {
        userLevel = LEVEL_TIERS[i].level;
        break;
      }
    }

    const defsSnap = await db.collection(BADGE_DEFINITIONS).orderBy('order', 'asc').get();
    const newBadgeIds: string[] = [];
    for (const defDoc of defsSnap.docs) {
      const id = defDoc.id;
      if (!id.startsWith('custom_')) continue;
      if (existingBadges.includes(id) || newBadgeIds.includes(id)) continue;
      const def = defDoc.data();
      const reqType = def.requirementType as string;
      const config = (def.requirementConfig as Record<string, unknown>) || {};
      if (reqType === 'manual') continue;
      if (reqType === 'verified_actions') {
        const actionTypes = (Array.isArray(config.actionTypes) ? config.actionTypes : []) as string[];
        const requiredCount = typeof config.count === 'number' ? Math.max(0, config.count) : 1;
        let count = 0;
        if (actionTypes.length === 0) {
          count = Object.values(actionCountByReason).reduce((a, b) => a + b, 0);
        } else {
          for (const t of actionTypes) count += actionCountByReason[t] || 0;
        }
        if (count >= requiredCount) newBadgeIds.push(id);
      } else if (reqType === 'min_level') {
        const minLevel = typeof config.minLevel === 'number' ? config.minLevel : 0;
        if (userLevel >= minLevel) newBadgeIds.push(id);
      } else if (reqType === 'min_ot_spent') {
        const minSpent = typeof config.minOtSpent === 'number' ? config.minOtSpent : 0;
        if (totalSpent >= minSpent) newBadgeIds.push(id);
      }
    }

    if (newBadgeIds.length > 0) {
      await userRef.update({
        badges: FieldValue.arrayUnion(...newBadgeIds),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return { success: true, awarded: newBadgeIds };
  });

// ========== ADMIN: PARTNERS & PERKS (Firestore CRUD) ==========
const PERKS = 'perks';

function isAdminContext(context: functions.https.CallableContext): boolean {
  if (!context.auth) return false;
  const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === email);
}

function sanitizePartner(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const id = typeof data.id === 'string' ? data.id.trim() : '';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const category = typeof data.category === 'string' ? data.category.trim() : '';
  const tier = data.tier === 'common' || data.tier === 'rare' || data.tier === 'legendary' || data.tier === 'apex' ? data.tier : 'common';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const hours = typeof data.hours === 'string' ? data.hours.trim() : '';
  const verified = data.verified === true;
  const loc = data.location && typeof data.location === 'object' && data.location !== null ? (data.location as Record<string, unknown>) : {};
  const lat = typeof loc.lat === 'number' ? loc.lat : typeof loc.lat === 'string' ? parseFloat(loc.lat) : 0;
  const lng = typeof loc.lng === 'number' ? loc.lng : typeof loc.lng === 'string' ? parseFloat(loc.lng) : 0;
  const address = typeof loc.address === 'string' ? loc.address.trim() : '';
  const termsShort = typeof data.termsShort === 'string' ? data.termsShort.trim().slice(0, 200) : null;
  const featuredImageUrl = typeof data.featuredImageUrl === 'string' ? data.featuredImageUrl.trim().slice(0, 500) : null;
  const logoUrl = typeof data.logoUrl === 'string' ? data.logoUrl.trim().slice(0, 500) : null;
  const about = typeof data.about === 'string' ? data.about.trim().slice(0, 500) : null;
  const showOrbOpsButton = data.showOrbOpsButton !== false;
  const offersCatering = data.offersCatering === true;
  if (!id || !name) return null;
  return {
    id,
    name,
    category,
    tier,
    location: { lat: Number.isFinite(lat) ? lat : 0, lng: Number.isFinite(lng) ? lng : 0, address: address || '' },
    description,
    hours,
    verified,
    termsShort: termsShort || null,
    featuredImageUrl: featuredImageUrl || null,
    logoUrl: logoUrl || null,
    about: about || null,
    showOrbOpsButton,
    offersCatering,
  };
}

function sanitizePerk(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const id = typeof data.id === 'string' ? data.id.trim() : '';
  const partnerId = typeof data.partnerId === 'string' ? data.partnerId.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const cost = typeof data.cost === 'number' ? Math.max(0, Math.floor(data.cost)) : typeof data.cost === 'string' ? Math.max(0, parseInt(data.cost, 10) || 0) : 0;
  const tier = data.tier === 'common' || data.tier === 'rare' || data.tier === 'legendary' || data.tier === 'apex' ? data.tier : 'common';
  const cooldown = typeof data.cooldown === 'string' ? data.cooldown.trim().slice(0, 20) : '';
  const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim().slice(0, 500) : null;
  if (!id || !partnerId || !title) return null;
  return {
    id,
    partnerId,
    title,
    description,
    cost,
    tier,
    cooldown: cooldown || '24h',
    imageUrl: imageUrl || null,
  };
}

export const adminCreatePartner = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const payload = sanitizePartner(data as Record<string, unknown>);
    if (!payload) return { success: false, message: 'Valid id and name are required.' };
    const ref = db.collection(PARTNERS).doc(payload.id as string);
    const snap = await ref.get();
    if (snap.exists) return { success: false, message: 'A partner with this ID already exists.' };
    await ref.set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: ref.id };
  });

export const adminUpdatePartner = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const payload = sanitizePartner(data as Record<string, unknown>);
    if (!payload) return { success: false, message: 'Valid id and name are required.' };
    const ref = db.collection(PARTNERS).doc(payload.id as string);
    await ref.set({ ...payload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true, id: ref.id };
  });

/** Partner self-service: update hours, description, about, visibility toggles. Owner only. */
export const partnerUpdateSelf = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    if (!partnerId) return { success: false, message: 'partnerId is required.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerData = partnerSnap.data()!;
    const ownerUid = (partnerData.ownerUid as string | undefined) || null;
    const userSnap = await db.collection(USERS).doc(uid).get();
    const userPartnerId = (userSnap.data()?.partnerId as string) || null;
    const isOwner = ownerUid === uid || userPartnerId === partnerId;
    if (!isOwner) return { success: false, message: 'Only the partner owner can update this.' };

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof d?.hours === 'string') update.hours = d.hours.trim().slice(0, 200);
    if (typeof d?.description === 'string') update.description = d.description.trim().slice(0, 500);
    if (typeof d?.about === 'string') update.about = d.about.trim().slice(0, 500);
    if (d?.logoUrl !== undefined) update.logoUrl = typeof d.logoUrl === 'string' ? d.logoUrl.trim().slice(0, 500) : null;
    if (typeof d?.phone === 'string') update.phone = d.phone.trim().slice(0, 50) || null;
    if (typeof d?.website === 'string') update.website = d.website.trim().slice(0, 200) || null;
    if (typeof d?.socialInstagram === 'string') update.socialInstagram = d.socialInstagram.trim().slice(0, 100) || null;
    if (typeof d?.socialTwitter === 'string') update.socialTwitter = d.socialTwitter.trim().slice(0, 100) || null;
    if (typeof d?.showOrbOpsButton === 'boolean') update.showOrbOpsButton = d.showOrbOpsButton;
    if (typeof d?.offersCatering === 'boolean') update.offersCatering = d.offersCatering;

    await partnerRef.update(update);
    return { success: true, id: partnerId };
  });

export const adminCreatePerk = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const payload = sanitizePerk(data as Record<string, unknown>);
    if (!payload) return { success: false, message: 'Valid id, partnerId, and title are required.' };
    const ref = db.collection(PERKS).doc(payload.id as string);
    const snap = await ref.get();
    if (snap.exists) return { success: false, message: 'A perk with this ID already exists.' };
    await ref.set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: ref.id };
  });

export const adminUpdatePerk = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const payload = sanitizePerk(data as Record<string, unknown>);
    if (!payload) return { success: false, message: 'Valid id, partnerId, and title are required.' };
    const ref = db.collection(PERKS).doc(payload.id as string);
    await ref.set({ ...payload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true, id: ref.id };
  });

/** Partner self-service: create perk. Owner only. Auto-generates perk ID. */
export const partnerCreatePerk = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const title = typeof d?.title === 'string' ? d.title.trim() : '';
    if (!partnerId || !title) return { success: false, message: 'partnerId and title are required.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerData = partnerSnap.data()!;
    const ownerUid = (partnerData.ownerUid as string | undefined) || null;
    const userSnap = await db.collection(USERS).doc(uid).get();
    const userPartnerId = (userSnap.data()?.partnerId as string) || null;
    const isOwner = ownerUid === uid || userPartnerId === partnerId;
    if (!isOwner) return { success: false, message: 'Only the partner owner can create perks.' };

    const cost = typeof d?.cost === 'number' ? Math.max(0, Math.floor(d.cost)) : Math.max(0, parseInt(String(d?.cost ?? 0), 10) || 0);
    const tier = (d?.tier === 'silver' || d?.tier === 'gold' || d?.tier === 'platinum' ? d.tier : 'silver') as 'silver' | 'gold' | 'platinum';
    const cooldown = typeof d?.cooldown === 'string' ? d.cooldown.trim().slice(0, 20) || '24h' : '24h';
    const description = typeof d?.description === 'string' ? d.description.trim() : '';
    const imageUrl = typeof d?.imageUrl === 'string' ? d.imageUrl.trim().slice(0, 500) || null : null;

    const id = `pk_${partnerId}_${Date.now()}`;
    const payload = { id, partnerId, title, description, cost, tier, cooldown, imageUrl, active: true };
    await db.collection(PERKS).doc(id).set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id };
  });

/** Partner self-service: update perk. Owner only. */
export const partnerUpdatePerk = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const perkId = typeof d?.perkId === 'string' ? d.perkId.trim() : '';
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    if (!perkId || !partnerId) return { success: false, message: 'perkId and partnerId are required.' };

    const perkRef = db.collection(PERKS).doc(perkId);
    const perkSnap = await perkRef.get();
    if (!perkSnap.exists) return { success: false, message: 'Perk not found.' };
    const perkData = perkSnap.data()!;
    if ((perkData.partnerId as string) !== partnerId) return { success: false, message: 'Perk does not belong to this partner.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerData = partnerSnap.data()!;
    const ownerUid = (partnerData.ownerUid as string | undefined) || null;
    const userSnap = await db.collection(USERS).doc(uid).get();
    const userPartnerId = (userSnap.data()?.partnerId as string) || null;
    const isOwner = ownerUid === uid || userPartnerId === partnerId;
    if (!isOwner) return { success: false, message: 'Only the partner owner can update perks.' };

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof d?.title === 'string' && d.title.trim()) update.title = d.title.trim();
    if (typeof d?.description === 'string') update.description = d.description.trim();
    if (typeof d?.cost === 'number') update.cost = Math.max(0, Math.floor(d.cost));
    if (d?.tier === 'silver' || d?.tier === 'gold' || d?.tier === 'platinum') update.tier = d.tier;
    if (typeof d?.cooldown === 'string') update.cooldown = d.cooldown.trim().slice(0, 20) || '24h';
    if (d?.imageUrl !== undefined) update.imageUrl = typeof d.imageUrl === 'string' ? d.imageUrl.trim().slice(0, 500) || null : null;
    if (typeof d?.active === 'boolean') update.active = d.active;

    await perkRef.update(update);
    return { success: true, id: perkId };
  });

const ORBSIGNAL_MARKETS = 'orbsignalMarkets';
const HOTSPOTS = 'hotspots';

/** Partner creates an Orb Signal market (e.g. "Will we sell out tonight?"). Owner only. Partner pays OT to create (spend sink). */
export const partnerCreateOrbSignalMarket = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const question = typeof d?.question === 'string' ? d.question.trim().slice(0, 200) : '';
    if (!partnerId || !question) return { success: false, message: 'partnerId and question are required.' };

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerData = partnerSnap.data()!;
    const ownerUid = (partnerData.ownerUid as string | undefined) || null;
    const userSnap = await db.collection(USERS).doc(uid).get();
    const userPartnerId = (userSnap.data()?.partnerId as string) || null;
    const isOwner = ownerUid === uid || userPartnerId === partnerId;
    if (!isOwner) return { success: false, message: 'Only the partner owner can create Signal markets.' };

    const outcomes = Array.isArray(d?.outcomes) && (d.outcomes as string[]).length >= 2
      ? (d.outcomes as string[]).slice(0, 5).map((o) => String(o).trim().slice(0, 50))
      : ['Yes', 'No'];
    const endAt = typeof d?.endAt === 'number' ? d.endAt : Date.now() + 24 * 60 * 60 * 1000;
    const tier = (partnerData.tier === 'silver' || partnerData.tier === 'gold' || partnerData.tier === 'platinum' ? partnerData.tier : 'silver') as 'silver' | 'gold' | 'platinum';
    const id = `sm_${partnerId}_${Date.now()}`;
    const endsAtStr = new Date(endAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
    await db.collection(ORBSIGNAL_MARKETS).doc(id).set({
      id,
      partnerId,
      question,
      outcomes,
      percentages: outcomes.map(() => Math.floor(100 / outcomes.length)),
      pool: 0,
      volume: 0,
      endsAt: endsAtStr,
      endsAtShort: '1d left',
      category: 'Partner',
      tier,
      voteCost: 10,
      rewardNote: 'Correct forecasts earn bonus OT',
      createdAt: FieldValue.serverTimestamp(),
      endAtTimestamp: endAt,
    });
    return { success: true, id };
  });

/** Activate a Hot Spot: writes Firestore hotspot doc. Production: use Stripe checkout then webhook to write this doc. */
export const partnerActivateHotspot = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    const durationHours = typeof d?.durationHours === 'number' ? Math.min(24, Math.max(1, d.durationHours)) : 2;

    const partnerRef = db.collection(PARTNERS).doc(partnerId);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return { success: false, message: 'Partner not found.' };
    const partnerData = partnerSnap.data()!;
    const ownerUid = (partnerData.ownerUid as string | undefined) || null;
    const userSnap = await db.collection(USERS).doc(uid).get();
    const userPartnerId = (userSnap.data()?.partnerId as string) || null;
    if (ownerUid !== uid && userPartnerId !== partnerId) return { success: false, message: 'Only the partner owner can activate Hot Spots.' };

    const now = Date.now();
    const expiresAt = now + durationHours * 60 * 60 * 1000;
    const docId = `${partnerId}_${now}`;
    await db.collection(HOTSPOTS).doc(docId).set({
      partnerId,
      partnerName: (partnerData.name as string) || 'Partner',
      activatedAt: now,
      expiresAt,
      durationHours,
      multiplier: 2,
    });
    return { success: true, hotspotId: docId, expiresAt };
  });

const PARTNER_DELETE_POLL_WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Delete poll: admin anytime; partner only if they created it and within 8 hours. */
export const deletePoll = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const pollId = typeof d?.pollId === 'string' ? d.pollId.trim() : '';
    if (!pollId) return { success: false, message: 'pollId is required.' };

    const pollRef = db.collection('polls').doc(pollId);
    const snap = await pollRef.get();
    if (!snap.exists) return { success: false, message: 'Poll not found.' };
    const pollData = snap.data()!;
    const partnerId = pollData.partnerId ?? null;
    const createdAt = pollData.createdAt?.toMillis?.() ?? null;

    const isAdmin = isAdminContext(context);
    if (isAdmin) {
      await pollRef.delete();
      return { success: true };
    }
    if (partnerId !== uid) return { success: false, message: 'Only the creator or an admin can delete this poll.' };
    if (createdAt == null) return { success: false, message: 'Cannot determine poll age.' };
    if (Date.now() - createdAt > PARTNER_DELETE_POLL_WINDOW_MS) {
      return { success: false, message: 'Partners can only delete their polls within 8 hours of creation.' };
    }
    await pollRef.delete();
    return { success: true };
  });

// ========== ADMIN: INVITE WITH ROLE ==========
const INVITE_CODES = 'inviteCodes';
const INVITE_CODE_LENGTH = 10;
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Admin only. Create an invite link; when the user signs up with this code they get the chosen role. */
export const createInviteLink = functions
  .region('us-central1')
  .runWith({ secrets: [ORPTAP_SECRET_ENV_KEY] })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    const env = getSecretEnv();
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const role = typeof d?.role === 'string' ? d.role.trim().toLowerCase() : 'user';
    const validRoles = ['user', 'partner', 'admin'];
    if (!validRoles.includes(role)) return { success: false, message: 'Role must be user, partner, or admin.' };
    const code = generateInviteCode();
    await db.collection(INVITE_CODES).doc(code).set({
      role,
      createdBy: context.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    const baseUrl = getConfig(env, 'EXPO_PUBLIC_APP_URL') || getConfig(env, 'APP_URL') || 'https://orbtap.web.app';
    const url = `${baseUrl}/auth/signup?invite=${code}`;
    return { success: true, code, url };
  });

/** After signup, call with the invite code from the signup URL to apply the role (one-time use). */
export const setRoleFromInvite = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data as Record<string, unknown> | null | undefined;
    const code = typeof d?.inviteCode === 'string' ? d.inviteCode.trim().toUpperCase() : '';
    if (!code) return { success: false, message: 'inviteCode is required.' };
    const inviteRef = db.collection(INVITE_CODES).doc(code);
    const snap = await inviteRef.get();
    if (!snap.exists) return { success: false, message: 'Invalid or already used invite code.' };
    const inviteData = snap.data()!;
    const role = (inviteData.role as string) || 'user';
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      tx.set(db.collection('users').doc(uid), { role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.delete(inviteRef);
    });
    return { success: true, role };
  });

// ========== ADMIN: DAILY RITUAL CONFIG ==========
/** Admin only. Save daily ritual config to Firestore so claimDailyOrbRitual uses it. */
export const setDailyRitualConfig = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== 'object') return { success: false, message: 'Config object required.' };
    const ref = db.collection(RITUAL_CONFIG_COLLECTION).doc(RITUAL_CONFIG_DOC);
    const payload: Record<string, unknown> = {
      ...d,
      updatedAt: Date.now(),
      updatedBy: (context.auth.token?.email as string) || context.auth.uid,
    };
    await ref.set(payload, { merge: true });
    return { success: true };
  });

// ========== ADMIN: DELETE CONTENT ==========
/** Admin only. Delete a post (OrbFeed). */
export const deletePost = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const postId = typeof d?.postId === 'string' ? d.postId.trim() : '';
    if (!postId) return { success: false, message: 'postId is required.' };
    const ref = db.collection('posts').doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Post not found.' };
    await ref.delete();
    return { success: true };
  });

/** Admin only. Delete a perk. */
export const deletePerk = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const perkId = typeof d?.perkId === 'string' ? d.perkId.trim() : '';
    if (!perkId) return { success: false, message: 'perkId is required.' };
    const ref = db.collection(PERKS).doc(perkId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Perk not found.' };
    await ref.delete();
    return { success: true };
  });

/** Admin only. Delete a partner (and optionally its perks in a batch). */
export const deletePartner = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const partnerId = typeof d?.partnerId === 'string' ? d.partnerId.trim() : '';
    if (!partnerId) return { success: false, message: 'partnerId is required.' };
    const ref = db.collection(PARTNERS).doc(partnerId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Partner not found.' };
    const perksSnap = await db.collection(PERKS).where('partnerId', '==', partnerId).get();
    const batch = db.batch();
    batch.delete(ref);
    perksSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return { success: true };
  });

// ========== FEATURED PARTNERS (Orb hub carousel: up to 3 paid + 1 wildcard) ==========
const APP_CONFIG = 'appConfig';
const FEATURED_PARTNERS_DOC = 'featuredPartners';
const MAX_FEATURED_SLOTS = 3;

export const getFeaturedPartnersConfig = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const ref = db.collection(APP_CONFIG).doc(FEATURED_PARTNERS_DOC);
    const snap = await ref.get();
    const data = snap.data() || {};
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const sanitized = entries.slice(0, MAX_FEATURED_SLOTS).map((e: Record<string, unknown>, i: number) => ({
      partnerId: typeof e.partnerId === 'string' ? e.partnerId.trim() : '',
      customImageUrl: typeof e.customImageUrl === 'string' ? e.customImageUrl.trim().slice(0, 600) : null,
      order: typeof e.order === 'number' ? e.order : i,
    })).filter((e: { partnerId: string }) => e.partnerId);
    return { success: true, entries: sanitized };
  });

export const setFeaturedPartnersConfig = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const raw = Array.isArray(d?.entries) ? d.entries : [];
    const entries = raw.slice(0, MAX_FEATURED_SLOTS).map((e: Record<string, unknown>, i: number) => ({
      partnerId: typeof e.partnerId === 'string' ? e.partnerId.trim() : '',
      customImageUrl: typeof e.customImageUrl === 'string' ? e.customImageUrl.trim().slice(0, 600) : null,
      order: i,
    })).filter((e: { partnerId: string }) => e.partnerId);
    const ref = db.collection(APP_CONFIG).doc(FEATURED_PARTNERS_DOC);
    await ref.set({ entries, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
  });

// ========== SPONSORED ADS (premium ad spots: orb carousel, daily ritual reward) ==========
const SPONSORED_ADS_CONFIG_DOC = 'sponsoredAdsConfig';
const SPONSORED_ADS_COLLECTION = 'sponsoredAds';

function sanitizeAdDoc(d: Record<string, unknown>, id: string): Record<string, unknown> {
  const placement = d.placement === 'orb_carousel' || d.placement === 'daily_ritual_reward' ? d.placement : 'orb_carousel';
  const type = d.type === 'video' ? 'video' : 'image';
  const mediaUrl = typeof d.mediaUrl === 'string' ? d.mediaUrl.trim().slice(0, 800) : '';
  const videoDurationSeconds = typeof d.videoDurationSeconds === 'number' ? Math.max(0, Math.min(60, d.videoDurationSeconds)) : undefined;
  const rawCtas = Array.isArray(d.ctas) ? d.ctas : [];
  const ctas = rawCtas.slice(0, 3).map((c: unknown) => {
    const x = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
    return { label: typeof x.label === 'string' ? x.label.trim().slice(0, 40) : 'Learn more', url: typeof x.url === 'string' ? x.url.trim().slice(0, 600) : '' };
  }).filter((c: { url: string }) => c.url);
  const order = typeof d.order === 'number' ? d.order : 0;
  const active = d.active !== false;
  const sponsorName = typeof d.sponsorName === 'string' ? d.sponsorName.trim().slice(0, 80) : undefined;
  const startAt = typeof d.startAt === 'number' && d.startAt > 0 ? d.startAt : (d.startAt === null || d.startAt === undefined ? undefined : null);
  const endAt = typeof d.endAt === 'number' && d.endAt > 0 ? d.endAt : (d.endAt === null || d.endAt === undefined ? undefined : null);
  const out: Record<string, unknown> = { id, placement, type, mediaUrl, videoDurationSeconds, ctas, order, active, sponsorName };
  if (startAt !== undefined) out.startAt = startAt;
  if (endAt !== undefined) out.endAt = endAt;
  if (typeof d.createdAt === 'number') out.createdAt = d.createdAt;
  if (typeof d.updatedAt === 'number') out.updatedAt = d.updatedAt;
  return out;
}

export const getSponsoredAdsConfig = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const ref = db.collection(APP_CONFIG).doc(SPONSORED_ADS_CONFIG_DOC);
    const snap = await ref.get();
    const data = snap.data() || {};
    const carouselTransitionSeconds = Math.max(30, Math.min(120, typeof data.carouselTransitionSeconds === 'number' ? data.carouselTransitionSeconds : 60));
    const maxCarouselSlots = Math.max(1, Math.min(3, typeof data.maxCarouselSlots === 'number' ? data.maxCarouselSlots : 3));
    const dailyRitualRewardAdEnabled = data.dailyRitualRewardAdEnabled === true;
    const dailyRitualRewardAdId = typeof data.dailyRitualRewardAdId === 'string' ? data.dailyRitualRewardAdId.trim() : null;
    return {
      success: true,
      config: { carouselTransitionSeconds, maxCarouselSlots, dailyRitualRewardAdEnabled, dailyRitualRewardAdId },
    };
  });

export const setSponsoredAdsConfig = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const carouselTransitionSeconds = Math.max(30, Math.min(120, typeof d?.carouselTransitionSeconds === 'number' ? d.carouselTransitionSeconds : 60));
    const maxCarouselSlots = Math.max(1, Math.min(3, typeof d?.maxCarouselSlots === 'number' ? d.maxCarouselSlots : 3));
    const dailyRitualRewardAdEnabled = d?.dailyRitualRewardAdEnabled === true;
    const dailyRitualRewardAdId = typeof d?.dailyRitualRewardAdId === 'string' ? d.dailyRitualRewardAdId.trim() : null;
    const ref = db.collection(APP_CONFIG).doc(SPONSORED_ADS_CONFIG_DOC);
    await ref.set({ carouselTransitionSeconds, maxCarouselSlots, dailyRitualRewardAdEnabled, dailyRitualRewardAdId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
  });

export const listSponsoredAds = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    const d = data as Record<string, unknown> | null | undefined;
    const placement = d?.placement === 'orb_carousel' || d?.placement === 'daily_ritual_reward' ? d.placement : 'orb_carousel';
    const configRef = db.collection(APP_CONFIG).doc(SPONSORED_ADS_CONFIG_DOC);
    const configSnap = await configRef.get();
    const configData = configSnap.data() || {};
    const maxSlots = placement === 'orb_carousel' ? Math.max(1, Math.min(3, (configData.maxCarouselSlots as number) ?? 3)) : 1;
    const snap = await db.collection(SPONSORED_ADS_COLLECTION)
      .where('placement', '==', placement)
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .orderBy('createdAt', 'asc')
      .limit(30)
      .get();
    const now = Date.now();
    const ads = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>))
      .filter((ad) => {
        const startAt = ad.startAt as number | undefined | null;
        const endAt = ad.endAt as number | undefined | null;
        if (startAt != null && now < startAt) return false;
        if (endAt != null && now > endAt) return false;
        return true;
      })
      .slice(0, maxSlots);
    return { success: true, ads };
  });

export const adminListSponsoredAds = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const snap = await db.collection(SPONSORED_ADS_COLLECTION).orderBy('placement', 'asc').orderBy('order', 'asc').orderBy('createdAt', 'asc').get();
    const ads = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, ads };
  });

export const createSponsoredAd = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== 'object') return { success: false, message: 'Payload required.' };
    const mediaUrl = typeof d.mediaUrl === 'string' ? d.mediaUrl.trim() : '';
    if (!mediaUrl) return { success: false, message: 'mediaUrl is required.' };
    const now = Date.now();
    const ref = db.collection(SPONSORED_ADS_COLLECTION).doc();
    const sanitized = sanitizeAdDoc({ ...d, createdAt: now, updatedAt: now }, ref.id);
    await ref.set(sanitized);
    return { success: true, adId: ref.id, ad: { id: ref.id, ...sanitized } };
  });

export const updateSponsoredAd = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const adId = typeof d?.adId === 'string' ? d.adId.trim() : '';
    if (!adId) return { success: false, message: 'adId is required.' };
    const ref = db.collection(SPONSORED_ADS_COLLECTION).doc(adId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: 'Ad not found.' };
    const existing = snap.data() || {};
    const merged = { ...existing, ...d, updatedAt: Date.now() };
    const sanitized = sanitizeAdDoc(merged, adId);
    const { id: _id, createdAt: _c, ...updateFields } = sanitized as Record<string, unknown>;
    await ref.update(updateFields);
    return { success: true, ad: { id: adId, ...sanitized } };
  });

export const deleteSponsoredAd = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const adId = typeof d?.adId === 'string' ? d.adId.trim() : '';
    if (!adId) return { success: false, message: 'adId is required.' };
    const ref = db.collection(SPONSORED_ADS_COLLECTION).doc(adId);
    await ref.delete();
    return { success: true };
  });

// ========== ADMIN: USER MANAGEMENT ==========
export const listUsersForAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const limit = Math.min(200, Math.max(10, typeof d?.limit === 'number' ? d.limit : 100));
    const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(limit).get();
    const users: { uid: string; email: string | null; displayName: string | null; username: string | null; discoverable: boolean; suspended: boolean; createdAt: number | null }[] = [];
    for (const doc of snap.docs) {
      const d2 = doc.data();
      const createdAt = (d2.createdAt as admin.firestore.Timestamp)?.toMillis?.();
      users.push({
        uid: doc.id,
        email: (d2.email as string) ?? null,
        displayName: (d2.displayName as string) ?? null,
        username: (d2.username as string) ?? null,
        discoverable: d2.discoverable === true,
        suspended: d2.suspended === true,
        createdAt: typeof createdAt === 'number' ? createdAt : null,
      });
    }
    return { success: true, users };
  });

export const removeUserByAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const uid = typeof d?.uid === 'string' ? d.uid.trim() : '';
    if (!uid) return { success: false, message: 'uid is required.' };
    if (uid === context.auth.uid) return { success: false, message: 'Cannot remove yourself.' };
    try {
      await auth.getUser(uid);
    } catch {
      return { success: false, message: 'User not found in Auth.' };
    }
    const userRef = db.collection('users').doc(uid);
    const subcollections = ['friends', 'friendRequestsSent', 'friendRequestsReceived', 'followsPartners', 'devicePushTokens', 'notifications'];
    const batch = db.batch();
    for (const sub of subcollections) {
      const subSnap = await userRef.collection(sub).get();
      subSnap.docs.forEach((doc) => batch.delete(doc.ref));
    }
    const privatePrefs = userRef.collection('private').doc('notificationPreferences');
    const prefsSnap = await privatePrefs.get();
    if (prefsSnap.exists) batch.delete(prefsSnap.ref);
    batch.delete(userRef);
    await batch.commit();
    await auth.deleteUser(uid);
    return { success: true };
  });

export const setAllUsersDiscoverable = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const snap = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;
    for (const doc of snap.docs) {
      batch.update(doc.ref, { discoverable: true });
      count++;
      if (count >= 500) break;
    }
    await batch.commit();
    return { success: true, count };
  });

export const suspendUserByAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const uid = typeof d?.uid === 'string' ? d.uid.trim() : '';
    if (!uid) return { success: false, message: 'uid is required.' };
    if (uid === context.auth.uid) return { success: false, message: 'Cannot suspend yourself.' };
    try {
      await auth.getUser(uid);
    } catch {
      return { success: false, message: 'User not found in Auth.' };
    }
    await auth.updateUser(uid, { disabled: true });
    const userRef = db.collection('users').doc(uid);
    await userRef.set({ suspended: true, suspendedAt: FieldValue.serverTimestamp(), suspendedBy: context.auth.uid }, { merge: true });
    return { success: true };
  });

export const unsuspendUserByAdmin = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Must be signed in.' };
    if (!isAdminContext(context)) return { success: false, message: 'Admin only.' };
    const d = data as Record<string, unknown> | null | undefined;
    const uid = typeof d?.uid === 'string' ? d.uid.trim() : '';
    if (!uid) return { success: false, message: 'uid is required.' };
    try {
      await auth.getUser(uid);
    } catch {
      return { success: false, message: 'User not found in Auth.' };
    }
    await auth.updateUser(uid, { disabled: false });
    const userRef = db.collection('users').doc(uid);
    await userRef.set({ suspended: false, suspendedAt: FieldValue.delete(), suspendedBy: FieldValue.delete() }, { merge: true });
    return { success: true };
  });

// OrbBounty™ — Deal Bounty callables
export { bountyCreate, bountyGet, bountyFeed, bountyListMine, bountyBid, bountyAcceptBid, bountyVerifyFulfillment, bountyDeleteBounty, bountyListAdmin } from './orbBounty';

// OrbIntent™ — Intent protocol + auto-deal agent callables
export {
  intentCreate,
  intentGet,
  intentFeed,
  intentListMine,
  intentListForPartner,
  intentOffer,
  intentAcceptOffer,
  intentVerifyFulfillment,
  ruleCreate,
  ruleUpdate,
  ruleList,
  ruleRunNow,
  dealDoneGet,
  adminOrbIntentMetrics,
  adminOrbIntentUpdateConfig,
} from './orbIntent';

// OrbPass™ — config, eligible offers, redemption, admin
export {
  orbPassGetConfig,
  orbPassEligibleOffers,
  orbPassRedemptionInitiate,
  orbPassRedemptionVerify,
  orbPassRedemptionComplete,
  orbPassRedemptionHistory,
  orbPassPartnerInbox,
  orbPassPartnerUpdateSettings,
  adminOrbPassMetrics,
  adminOrbPassUpdateConfig,
  adminOrbPassSettlementRunMonth,
  adminOrbPassEmergencyKill,
} from './orbPass';

// Stamp Cards™ — earn stamp, redeem reward, programs
export {
  stampCardsEarnStamp,
  stampCardsRedeemReward,
  stampCardsGetProgram,
  stampCardsGetActiveProgramForPartner,
  stampCardsListProgramsForPartner,
  stampCardsGetUserState,
  stampCardsUpsertProgram,
} from './stampCards';

/** Stamp card reminder push: reward expiring in 24h. Shared logic for callable + scheduled job. */
const STAMP_CARD_STATE_COLLECTION = 'stampCardState';
const STAMP_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

async function runStampCardsReminders(): Promise<{ sent: number }> {
  const config = await getPushConfig();
  if (!config.stampReminderEnabled) return { sent: 0 };
  const now = Date.now();
  const windowEnd = now + STAMP_REMINDER_WINDOW_MS;
  const statesSnap = await db.collection(STAMP_CARD_STATE_COLLECTION)
    .where('activeReward.status', '==', 'EARNED')
    .get();
  const candidates: { uid: string; partnerId: string }[] = [];
  for (const doc of statesSnap.docs) {
    const data = doc.data();
    const activeReward = data?.activeReward as { status?: string; expiresAt?: number; partnerId?: string } | null;
    if (!activeReward || activeReward.status !== 'EARNED') continue;
    const expiresAt = activeReward.expiresAt;
    if (typeof expiresAt !== 'number' || expiresAt < now || expiresAt > windowEnd) continue;
    const uid = data?.uid as string;
    const partnerId = (activeReward.partnerId || data?.partnerId) as string;
    if (uid && partnerId) candidates.push({ uid, partnerId });
  }
  const byUid = new Map<string, string>();
  candidates.forEach(({ uid, partnerId }) => { if (!byUid.has(uid)) byUid.set(uid, partnerId); });
  const partnerIds = [...new Set(byUid.values())];
  const partnerNames: Record<string, string> = {};
  if (partnerIds.length > 0) {
    const batchSize = 10;
    for (let i = 0; i < partnerIds.length; i += batchSize) {
      const chunk = partnerIds.slice(i, i + batchSize);
      const refs = chunk.map((id) => db.collection(PARTNERS).doc(id));
      const snaps = await db.getAll(...refs);
      snaps.forEach((snap, idx) => {
        const id = chunk[idx];
        partnerNames[id] = (snap.data()?.name as string)?.trim?.() || 'A partner';
      });
    }
  }
  let sent = 0;
  for (const [uid, partnerId] of byUid) {
    const partnerName = partnerNames[partnerId] ?? 'A partner';
    await sendInAppAndPushToUsers(
      [uid],
      {
        type: 'stamp_reward_expiring',
        title: 'Stamp reward expiring soon',
        body: `Your reward at ${partnerName} expires in 24 hours. Claim it in Wallet → Stamp Cards.`,
        data: { url: '/stamp-cards' },
      },
      { pushPrefKey: 'stampReminders' }
    );
    sent += 1;
  }
  return { sent };
}

export const stampCardsSendReminders = functions
  .region('us-central1')
  .https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { success: false, message: 'Not authenticated.' };
    const email = (context.auth.token?.email as string)?.toLowerCase?.() || '';
    if (!ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
      return { success: false, message: 'Admin only.' };
    }
    const { sent } = await runStampCardsReminders();
    return { success: true, message: `Stamp reminders sent to ${sent} user(s).`, sent };
  });

/** Runs daily at 10:00 UTC; sends stamp reward-expiring push to eligible users. */
export const stampCardsRemindersScheduled = functions
  .region('us-central1')
  .pubsub.schedule('0 10 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const { sent } = await runStampCardsReminders();
    if (sent > 0) console.log('Stamp reminders sent to', sent, 'user(s).');
  });

/** Runs daily at 00:00 UTC; updates metaStats/global with partnerCount and totalRedemptions for social proof. */
export const updateGlobalStatsScheduled = functions
  .region('us-central1')
  .pubsub.schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const statsRef = db.collection(META_STATS).doc(STATS_DOC);
    const [partnersSnap, actionsSnap] = await Promise.all([
      db.collection(PARTNERS).count().get(),
      db.collection(VERIFIED_ACTIONS).where('reasonCode', '==', 'EMIT_VERIFIED_REDEEM').count().get(),
    ]);
    const partnerCount = partnersSnap.data().count;
    const totalRedemptions = actionsSnap.data().count;
    await statsRef.set({ partnerCount, totalRedemptions, statsUpdatedAt: Date.now() }, { merge: true });
  });

/** Runs every hour; resolves Orb Signal markets past endAt (sets status, can pay correct forecasters). */
export const resolveOrbSignalMarketsScheduled = functions
  .region('us-central1')
  .pubsub.schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = Date.now();
    const marketsSnap = await db.collection(ORBSIGNAL_MARKETS)
      .where('endAtTimestamp', '<=', now)
      .get();
    for (const doc of marketsSnap.docs) {
      const data = doc.data();
      if (data.status === 'resolved') continue;
      await doc.ref.update({ status: 'resolved', resolvedAt: now });
    }
  });

// Partner Menu OCR (Cloud Vision)
export { menuOcrFromUrls } from './menuOcr';

// OrbPilot™ — Outcome-First Verified-Visit Autopilot
export {
  orbPilotCampaignCreate,
  orbPilotCampaignGet,
  orbPilotCampaignUpdate,
  orbPilotCampaignActivate,
  orbPilotCampaignPause,
  orbPilotCampaignResume,
  orbPilotCampaignEnd,
  orbPilotEngineTick,
  orbPilotOfferNearby,
  orbPilotOfferClaim,
  orbPilotOfferCancel,
  orbPilotVerifyInitiate,
  orbPilotVerifyComplete,
  orbPilotPinCurrent,
  orbPilotPinRotate,
  orbPilotMetricsPartner,
  orbPilotMetricsCampaign,
  orbPilotAdminKillSwitch,
  orbPilotAdminAudit,
  orbPilotAdminUserTrust,
  orbPilotAdminPartnerRisk,
  orbPilotAdminListCampaigns,
  orbPilotAdminListTrust,
  orbPilotAdminGetConfig,
  orbPilotAdminUpdateConfig,
  orbPilotAdminEngineLastRun,
  orbPilotPartnerListCampaigns,
  orbPilotPartnerActivity,
  orbPilotUserHistory,
  // Appendix 3 — Consent
  orbPilotConsentUser,
  orbPilotConsentPartner,
  orbPilotConsentStatus,
  // Appendix 3 — Entitlements
  orbPilotEntitlementsUser,
  orbPilotEntitlementsPartner,
  // Appendix 3 — Disputes
  orbPilotDisputeSubmit,
  orbPilotDisputeListPartner,
  orbPilotDisputeListAdmin,
  orbPilotDisputeResolve,
  orbPilotDisputeReview,
  // Appendix 3 — Restrictions
  orbPilotRestrictUser,
  orbPilotLiftUserRestriction,
  orbPilotRestrictPartner,
  orbPilotLiftPartnerRestriction,
  // Appendix 2 — Spend Ledger + Health/Abuse
  orbPilotSpendLedger,
  orbPilotAdminHealth,
  orbPilotAdminAbuse,
} from './orbPilot';

// ─── Stripe billing (Sprint 13) ───────────────────────────────────────────────
export { createCheckoutSession, createBillingPortal, stripeWebhook, reportOrbPilotVisit } from './stripe';

// ─── sendPush — server-side push notification helper (Sprint 13) ──────────────
/**
 * Sends push notifications via Expo Push API to one or more tokens.
 * Callable by other Cloud Functions or via admin HTTPS trigger.
 *
 * Triggers wired:
 *   - Nearby slot released       → when orbPilotEngineTick opens a new window
 *   - Streak at risk (8pm)       → stampCardsRemindersScheduled extended
 *   - Mission expiring           → onVerifiedActionCreated (if no mission done)
 *   - Sphere activity            → onPostCreated extended
 *   - OrbPilot visit confirmed   → orbPilotVerifyComplete extended
 *   - FriendPass accepted        → onUserReferralWritten extended
 */
export const sendPush = functions
  .region('us-central1')
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    // Internal use only — must be called from another Cloud Function or admin SDK.
    // Client calls are blocked unless caller is an admin.
    const email = (context.auth?.token?.email as string)?.toLowerCase?.() || '';
    const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === email);
    if (!context.auth || !isAdmin) {
      return { success: false, message: 'Admin only.' };
    }

    const d = data as { tokens: string[]; title: string; body: string; data?: Record<string, string> } | null;
    if (!d?.tokens?.length || !d.title || !d.body) {
      return { success: false, message: 'tokens, title, and body are required.' };
    }

    const messages = d.tokens.filter((t) => t && t.startsWith('ExponentPushToken')).slice(0, 100).map((to) => ({
      to,
      title: d.title,
      body: d.body,
      data: d.data ?? {},
      sound: 'default',
      channelId: 'default',
    }));

    if (messages.length === 0) {
      return { success: false, message: 'No valid Expo push tokens.' };
    }

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      return { success: false, message: `Expo API error: ${res.status}` };
    }

    return { success: true, sent: messages.length };
  });

/**
 * Internal helper — fetch all push tokens for a user and fire a notification.
 * Called from Firestore triggers within this file.
 */
async function pushToUser(uid: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
  try {
    const snap = await db.collection('users').doc(uid).collection('devicePushTokens').get();
    const tokens: string[] = [];
    snap.docs.forEach((d) => {
      const t = d.data()?.expoPushToken;
      if (typeof t === 'string' && t.startsWith('ExponentPushToken')) tokens.push(t);
    });
    if (!tokens.length) return;
    const messages = tokens.slice(0, 5).map((to) => ({ to, title, body, data: data ?? {}, sound: 'default', channelId: 'default' }));
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    functions.logger.warn('pushToUser failed', { uid, err });
  }
}

// Streak-at-risk reminder — 8pm daily if user hasn't scanned today.
export const streakRiskReminder = functions
  .region('us-central1')
  .pubsub.schedule('0 20 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    // Find users with streak > 0 who have not verified today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const snap = await db.collection('users')
      .where('streakCount', '>', 0)
      .limit(1000)
      .get();
    const promises: Promise<void>[] = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const lastVV = data.lastVerifiedAt as admin.firestore.Timestamp | undefined;
      if (!lastVV || lastVV.toMillis() < todayStart.getTime()) {
        promises.push(pushToUser(
          doc.id,
          '🔥 Streak at risk!',
          `Your ${data.streakCount}-day streak ends at midnight. Scan a QR to keep it alive.`,
          { url: '/(tabs)' },
        ));
      }
    });
    await Promise.allSettled(promises);
    functions.logger.info('streakRiskReminder sent', { count: promises.length });
  });

