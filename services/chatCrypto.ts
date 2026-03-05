/**
 * Client-side encryption for OrbTap chat.
 * Messages are encrypted with AES before sending to Firestore; only members who know
 * the sphere invite code can derive the key and decrypt. No plaintext on server.
 * Uses crypto-es (Expo-compatible, no native deps, no cost).
 */
import { AES, Utf8 } from 'crypto-es';

const KEY_PREFIX = 'orbtap:sphere:';

/** Derive a stable secret for this sphere. Only members with inviteCode can decrypt. */
function deriveSecret(inviteCode: string, sphereId: string): string {
  return KEY_PREFIX + inviteCode.replace(/\s/g, '') + ':' + sphereId;
}

/**
 * Encrypt plaintext for a sphere. Store the returned string in Firestore.
 */
export function encryptMessage(plaintext: string, inviteCode: string, sphereId: string): string {
  const key = deriveSecret(inviteCode, sphereId);
  return AES.encrypt(plaintext, key).toString();
}

/**
 * Decrypt a ciphertext string from Firestore. Returns plaintext or empty string on failure.
 */
export function decryptMessage(ciphertext: string, inviteCode: string, sphereId: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') return '';
  try {
    const key = deriveSecret(inviteCode, sphereId);
    const bytes = AES.decrypt(ciphertext, key);
    return bytes.toString(Utf8) || '';
  } catch {
    return '';
  }
}
