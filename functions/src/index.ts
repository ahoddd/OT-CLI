/**
 * OrbTap Verify — Verify-Before-Create anti-bot strategy.
 * No account is created until the user proves they control the email (6-digit code).
 * Rate limiting, one-time codes, and short expiry make bulk signups and bots impractical.
 *
 * Config (firebase functions:config:set env.encryption_key "64-char-hex" env.resend_api_key "re_xxx" env.orbtap_from_email "OrbTap <verify@orbtap.com>"):
 *   env.encryption_key — 64-char hex for AES-256 (password storage)
 *   env.resend_api_key — Resend API key
 *   env.orbtap_from_email — From address (verified in Resend)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import * as crypto from 'crypto';

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

function config(key: string): string {
  return (functions.config().env as Record<string, string>)?.[key] || process.env[key] || '';
}

const VERIFICATION_CODES = 'verificationCodes';
const RATE_LIMIT = 'verificationRateLimit';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CODES_PER_EMAIL_PER_HOUR = 3;
const MAX_CODES_PER_IP_PER_DAY = 10;

function getEncryptionKey(): Buffer {
  const key = config('encryption_key') || config('ENCRYPTION_KEY');
  if (!key || key.length < 64) {
    throw new Error('encryption_key must be set (64+ hex chars) in functions config');
  }
  return Buffer.from(key.slice(0, 64), 'hex');
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('base64') + ':' + tag.toString('base64') + ':' + enc.toString('base64');
}

function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
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
  .https.onCall(async (data, context) => {
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    const password = typeof data?.password === 'string' ? data.password : '';
    const displayName = typeof data?.displayName === 'string' ? data.displayName.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: 'Valid email is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const ip = (context.rawRequest?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    await checkRateLimitEmail(email);
    await checkRateLimitIp(ip);

    const code = generateCode();
    const expiry = Date.now() + CODE_EXPIRY_MS;
    const encPassword = encrypt(password);
    const docId = safeEmailId(email);
    await db.collection(VERIFICATION_CODES).doc(docId).set({
      email,
      encPassword,
      displayName: displayName || email.split('@')[0],
      code,
      expiry,
      createdAt: Date.now(),
    });

    const resendKey = config('resend_api_key') || config('RESEND_API_KEY');
    const fromEmail = config('orbtap_from_email') || config('ORBTAP_FROM_EMAIL') || 'OrbTap <verify@orbtap.com>';
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
  .https.onCall(async (data) => {
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    const code = typeof data?.code === 'string' ? data.code.replace(/\D/g, '').slice(0, 6) : '';
    const password = typeof data?.password === 'string' ? data.password : '';
    const displayName = typeof data?.displayName === 'string' ? data.displayName.trim() : '';

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
        plainPassword = decrypt(doc.encPassword);
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
      const totalUsers = await db.runTransaction(async (tx) => {
        const statsSnap = await tx.get(statsRef);
        const prev = (statsSnap.data()?.totalUsers as number) ?? 0;
        const next = prev + 1;
        tx.set(statsRef, { totalUsers: next }, { merge: true });
        const badges: string[] = [];
        for (let i = 0; i < FOUNDING_CAPS.length; i++) {
          if (next <= FOUNDING_CAPS[i]) badges.push(FOUNDING_BADGE_IDS[i]);
        }
        tx.set(userRef, {
          displayName: name,
          badges,
          createdAt: FieldValue.serverTimestamp(),
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
  .https.onCall(async (data, context) => {
    const partnerId = typeof data?.partnerId === 'string' ? data.partnerId.trim() : '';
    const userId = typeof data?.userId === 'string' ? data.userId.trim() : '';
    const perkId = typeof data?.perkId === 'string' ? data.perkId.trim() : '';
    const points = typeof data?.points === 'number' ? Math.max(0, Math.floor(data.points)) : 0;

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
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      return { success: false, message: 'Must be signed in to redeem.' };
    }
    const uid = context.auth.uid;
    const token = typeof data?.token === 'string' ? data.token.replace(/\s/g, '').toUpperCase() : '';

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
