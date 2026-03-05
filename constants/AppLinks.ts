/**
 * App links and share copy for viral growth.
 * Set in .env or EAS Secrets for production:
 * - EXPO_PUBLIC_APP_LINK (e.g. https://orbtap.com)
 * - EXPO_PUBLIC_PRIVACY_POLICY_URL (required for store listing)
 * - EXPO_PUBLIC_TERMS_URL (required for store listing)
 * - EXPO_PUBLIC_LEGAL_ADDRESS (optional; e.g. "123 Main St, City, State ZIP")
 */

export const ORBTAP_APP_LINK = process.env.EXPO_PUBLIC_APP_LINK || 'https://orbtap.com';

/** Public URL to your Privacy Policy page. Use this exact URL in App Store Connect and Google Play Console. */
export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || ORBTAP_APP_LINK + '/legal/privacy';

/** Public URL to your Terms of Service page. Use in store listing if required. */
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || ORBTAP_APP_LINK + '/legal/terms';

/** Physical address for legal/contact. Set EXPO_PUBLIC_LEGAL_ADDRESS or add in store listing. */
export const LEGAL_ADDRESS = process.env.EXPO_PUBLIC_LEGAL_ADDRESS || 'See app store listing for address.';

export const ORBTAP_INVITE_MESSAGE = `Join me on OrbTap — tap orbs, earn points, redeem real perks. ${ORBTAP_APP_LINK}`;
export const ORBTAP_KNOWLEDGE_SHARE_SUFFIX = `\n\nDiscover more on OrbTap — ${ORBTAP_APP_LINK}`;

/** Viral-optimized invite & share copy (see constants/ViralCopy.ts). Re-exported so one source of truth. */
export { USER_INVITE_MESSAGE, DEFAULT_SHARE_MESSAGE } from './ViralCopy';

/** URL for joining a sphere by invite code. Scan QR or open in browser; app deep-links here, web can redirect to stores. */
export function sphereJoinUrl(inviteCode: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  const code = encodeURIComponent(String(inviteCode).trim());
  return `${base}/spheres/join?code=${code}`;
}

/** Optional: set in .env for join landing page to redirect to stores when app not installed. */
export const APP_STORE_URL = process.env.EXPO_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/orbtap';
export const PLAY_STORE_URL = process.env.EXPO_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.orbtap.app';

/** Billing / subscription management. When Stripe Customer Portal is wired, set EXPO_PUBLIC_BILLING_PORTAL_URL (or use Cloud Function that returns session URL). */
export const BILLING_PORTAL_URL = process.env.EXPO_PUBLIC_BILLING_PORTAL_URL || ORBTAP_APP_LINK + '/support';

/**
 * Stripe Payment Links — replace these with your actual Stripe Payment Links or Checkout Session URLs.
 * You can create these at https://dashboard.stripe.com/payment-links
 * For production, use Cloud Functions to create Stripe Checkout Sessions with user metadata.
 */
export const STRIPE_PREMIUM_MONTHLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_MONTHLY || 'https://buy.stripe.com/PLACEHOLDER_premium_monthly';
export const STRIPE_PREMIUM_YEARLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_YEARLY || 'https://buy.stripe.com/PLACEHOLDER_premium_yearly';
export const STRIPE_PRO_MONTHLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PRO_MONTHLY || 'https://buy.stripe.com/PLACEHOLDER_pro_monthly';
export const STRIPE_PRO_YEARLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PRO_YEARLY || 'https://buy.stripe.com/PLACEHOLDER_pro_yearly';
export const STRIPE_PARTNER_PREMIUM_MONTHLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PARTNER_PREMIUM_MONTHLY || 'https://buy.stripe.com/PLACEHOLDER_partner_premium_monthly';
export const STRIPE_PARTNER_PREMIUM_YEARLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PARTNER_PREMIUM_YEARLY || 'https://buy.stripe.com/PLACEHOLDER_partner_premium_yearly';
export const STRIPE_PARTNER_PRO_MONTHLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PARTNER_PRO_MONTHLY || 'https://buy.stripe.com/PLACEHOLDER_partner_pro_monthly';
export const STRIPE_PARTNER_PRO_YEARLY_LINK = process.env.EXPO_PUBLIC_STRIPE_PARTNER_PRO_YEARLY || 'https://buy.stripe.com/PLACEHOLDER_partner_pro_yearly';

/** Partner referral URL — share this to get 100 OT Points when referred business is approved. */
export function partnerReferralUrl(referralCode: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/partner-apply?ref=${encodeURIComponent(referralCode.trim())}`;
}

/** User invite URL — share with friends. When they sign up and join, you both get bonus OT. */
export function userInviteUrl(referrerUid: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/invite?invite=${encodeURIComponent(referrerUid.trim())}`;
}

/** Deep link to a proof receipt — shared links can open in app. */
export function proofDeepLink(proofId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/proof/${encodeURIComponent(proofId.trim())}`;
}

/** Deep link to a partner page — shared links open in app or redirect to stores. */
export function partnerDeepLink(partnerId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/partner/${encodeURIComponent(partnerId.trim())}`;
}

/** Deep link to a feed post — shared links open in app or redirect to stores. */
export function feedPostDeepLink(postId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/feed/${encodeURIComponent(postId.trim())}`;
}

/** Deep link to a bounty — app://bounty/:id or web /bounty/:id. */
export function bountyDeepLink(bountyId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/bounty/${encodeURIComponent(bountyId.trim())}`;
}

/** Deep link to an intent — app://intent/:id or web /intent/:id. */
export function intentDeepLink(intentId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/intent/${encodeURIComponent(intentId.trim())}`;
}

/** Deep link to a Deal Done Card — app://deal/:cardId or web /deal/:cardId. */
export function dealDoneDeepLink(cardId: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/deal/${encodeURIComponent(cardId.trim())}`;
}

/** Redeem deep link — used by scanner and QR codes at partner venues. Format: orbtap://redeem?partner=ID&perk=ID&points=N */
export function redeemDeepLink(partnerId: string, perkId: string, points: number): string {
  const p = encodeURIComponent(String(partnerId).trim());
  const k = encodeURIComponent(String(perkId).trim());
  const n = Math.max(0, Math.floor(points));
  return `orbtap://redeem?partner=${p}&perk=${k}&points=${n}`;
}

/** One-time user-bound redeem token — customer shows this QR at venue; only partner can verify. Format: orbtap://redeem?t=TOKEN */
export function redeemTokenDeepLink(token: string): string {
  const t = encodeURIComponent(String(token).trim());
  return `orbtap://redeem?t=${t}`;
}

/** Public user profile — for leaderboard, search, and share. Requires user to be discoverable. */
export function userProfileDeepLink(uid: string): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/user/${encodeURIComponent(String(uid).trim())}`;
}

/** OrbSwipe / Fuse My Night — recap share and CTA back into app. */
export function orbswipeDeepLink(): string {
  const base = ORBTAP_APP_LINK.replace(/\/$/, '');
  return `${base}/orbswipe`;
}
