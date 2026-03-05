"use strict";
/**
 * Phone verification for native (Expo / iOS / Android) via Twilio SMS.
 * Web continues to use Firebase linkWithPhoneNumber + RecaptchaVerifier.
 * Callables: requestPhoneVerificationCode, verifyPhoneVerificationCode.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneVerificationCode = exports.requestPhoneVerificationCode = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
const auth = admin.auth();
const PHONETWILIO_SECRET = 'PHONETWILIO';
const SESSIONS_COLLECTION = 'phoneVerificationSessions';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MS = 60 * 1000; // 1 min between sends per user
const MAX_SESSIONS_PER_UID = 5;
function getTwilioConfig() {
    try {
        const raw = process.env[PHONETWILIO_SECRET];
        if (!raw || typeof raw !== 'string')
            return null;
        const parsed = JSON.parse(raw);
        if ((parsed === null || parsed === void 0 ? void 0 : parsed.accountSid) && (parsed === null || parsed === void 0 ? void 0 : parsed.authToken) && (parsed === null || parsed === void 0 ? void 0 : parsed.fromNumber))
            return parsed;
    }
    catch (_a) {
        // ignore
    }
    return null;
}
function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
/** E.164 basic check */
function isE164(phone) {
    return /^\+[1-9]\d{6,14}$/.test(phone);
}
/**
 * Request a 6-digit SMS code. Called from native app (Expo / iOS / Android).
 * Requires Twilio secret PHONETWILIO: { "accountSid", "authToken", "fromNumber" }.
 */
exports.requestPhoneVerificationCode = functions
    .region('us-central1')
    .runWith({ secrets: [PHONETWILIO_SECRET] })
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const phoneNumber = typeof (d === null || d === void 0 ? void 0 : d.phoneNumber) === 'string' ? d.phoneNumber.trim() : '';
    if (!phoneNumber || !isE164(phoneNumber)) {
        return { success: false, message: 'Enter a valid phone number with country code (e.g. +1...).' };
    }
    const twilio = getTwilioConfig();
    if (!twilio) {
        return { success: false, message: 'Phone verification is not configured. Try again later or verify on the web app.' };
    }
    const rateRef = db.collection('phoneVerificationSessions').doc(`rate_${uid}`);
    const rateSnap = await rateRef.get();
    const lastSent = (_a = rateSnap.data()) === null || _a === void 0 ? void 0 : _a.lastSent;
    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
        return { success: false, message: 'Please wait a minute before requesting another code.' };
    }
    const sessionsSnap = await db.collection(SESSIONS_COLLECTION).where('uid', '==', uid).get();
    if (sessionsSnap.size >= MAX_SESSIONS_PER_UID) {
        return { success: false, message: 'Too many verification attempts. Try again later.' };
    }
    const code = generateCode();
    const sessionId = `${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = Date.now() + CODE_EXPIRY_MS;
    await db.collection(SESSIONS_COLLECTION).doc(sessionId).set({
        uid,
        phoneNumber,
        code,
        expiresAt,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await rateRef.set({ lastSent: Date.now() }, { merge: true });
    try {
        const twilioClient = await Promise.resolve().then(() => require('twilio')).then((m) => m.default);
        const client = twilioClient(twilio.accountSid, twilio.authToken);
        await client.messages.create({
            body: `Your OrbTap verification code is: ${code}. It expires in 10 minutes.`,
            from: twilio.fromNumber,
            to: phoneNumber,
        });
    }
    catch (e) {
        if ((e === null || e === void 0 ? void 0 : e.code) === 21211 || ((_b = e === null || e === void 0 ? void 0 : e.message) === null || _b === void 0 ? void 0 : _b.includes('Invalid'))) {
            return { success: false, message: 'Invalid phone number. Use country code (e.g. +1 for US).' };
        }
        if ((e === null || e === void 0 ? void 0 : e.code) === 21608 || ((_c = e === null || e === void 0 ? void 0 : e.message) === null || _c === void 0 ? void 0 : _c.includes('unverified'))) {
            return { success: false, message: 'SMS is not enabled for this number in development. Use a Twilio-verified number or production.' };
        }
        console.error('Twilio send error:', (_d = e === null || e === void 0 ? void 0 : e.message) !== null && _d !== void 0 ? _d : e);
        return { success: false, message: 'Could not send SMS. Try again or verify on the web app.' };
    }
    return { success: true, sessionId };
});
/**
 * Verify the 6-digit code and save phone to the user's profile.
 */
exports.verifyPhoneVerificationCode = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { success: false, message: 'Must be signed in.' };
    const uid = context.auth.uid;
    const d = data;
    const sessionId = typeof (d === null || d === void 0 ? void 0 : d.sessionId) === 'string' ? d.sessionId.trim() : '';
    const code = typeof (d === null || d === void 0 ? void 0 : d.code) === 'string' ? d.code.replace(/\D/g, '') : '';
    if (!sessionId || code.length < 4) {
        return { success: false, message: 'Enter the 6-digit code from the SMS.' };
    }
    const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
        return { success: false, message: 'Invalid or expired code. Request a new one.' };
    }
    const session = sessionSnap.data();
    if (session.uid !== uid) {
        return { success: false, message: 'Invalid session.' };
    }
    if (session.expiresAt < Date.now()) {
        await sessionRef.delete();
        return { success: false, message: 'Code expired. Request a new one.' };
    }
    if (session.code !== code) {
        return { success: false, message: 'Invalid code. Try again.' };
    }
    const phoneNumber = session.phoneNumber;
    await db.collection('users').doc(uid).set({ phoneNumber, phoneVerifiedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
    await sessionRef.delete();
    return { success: true };
});
//# sourceMappingURL=phoneVerification.js.map