/**
 * OrbTap analytics & error reporting (Sprint 10 — Observability).
 * Firebase Analytics only when document exists (real browser); no-op on native to avoid
 * "getElementsByTagName of undefined" (Firebase web SDK assumes DOM).
 * Use for: screen views, verified_win, app_error (from RootErrorBoundary).
 */

import { app } from '../firebaseConfig';

/** True only in a real browser; React Native has no document. */
const hasDocument = typeof document !== 'undefined';

function getAnalyticsSafe() {
  if (!hasDocument) return null;
  try {
    const { getAnalytics } = require('firebase/analytics');
    return getAnalytics(app);
  } catch {
    return null;
  }
}

/** Log a custom event. Safe to call from any platform; no-op on native or if Analytics not available. */
export function logEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (__DEV__) {
    console.log('[Analytics]', eventName, params ?? {});
  }
  const analytics = getAnalyticsSafe();
  if (!analytics) return;
  try {
    const { logEvent: firebaseLogEvent } = require('firebase/analytics');
    firebaseLogEvent(analytics, eventName, params);
  } catch (_) {
    // ignore
  }
}

/** Log screen view (for web; native can add later). */
export function logScreenView(screenName: string, screenClass?: string) {
  logEvent('screen_view', {
    screen_name: screenName,
    ...(screenClass && { screen_class: screenClass }),
  });
}

/** Log verified win (North Star action). */
export function logVerifiedWin(params: { partner_id?: string; perk_id?: string; points?: number }) {
  logEvent('verified_win', params as Record<string, string | number | boolean>);
}

/** Funnel events for conversion/retention analysis. */
export function logSignupComplete() {
  logEvent('signup_complete');
}

export function logOnboardingComplete(params?: { is_partner?: boolean }) {
  logEvent('onboarding_complete', params as Record<string, string | number | boolean> | undefined);
}

export function logFirstProofShare() {
  logEvent('first_proof_share');
}

export function logPremiumView(params?: { tier?: string }) {
  logEvent('premium_view', params as Record<string, string | number | boolean> | undefined);
}

/** Report caught error from RootErrorBoundary. Logs as app_error for dashboards. */
export function reportError(error: Error, errorInfo?: { componentStack?: string }) {
  const message = error?.message ?? String(error);
  const stack = errorInfo?.componentStack ?? (error as Error & { componentStack?: string }).componentStack ?? '';
  if (__DEV__) {
    console.error('[reportError]', message, stack);
  }
  logEvent('app_error', {
    message: message.slice(0, 100),
    component_stack: stack.slice(0, 200),
  });
}

// ─── Sprint 13 — 5 Critical Funnel Events ────────────────────────────────────

/**
 * North Star event: user completes a verified QR scan at a partner.
 * Fire once per successful redemption (after server confirms points awarded).
 */
export function logScanVerified(params: {
  partner_id: string;
  perk_id?: string;
  points: number;
  tier: string;
  is_first_scan?: boolean;
}) {
  logEvent('scan_verified', params as Record<string, string | number | boolean>);
}

/**
 * OrbPilot: user claims an available slot in a partner campaign.
 * Tracks demand-side conversion of the autopilot engine.
 */
export function logSlotClaimed(params: {
  partner_id: string;
  campaign_id: string;
  cpa_dollars?: number;
}) {
  logEvent('slot_claimed', params as Record<string, string | number | boolean>);
}

/**
 * Monetisation funnel: premium upgrade CTA was shown to a free/silver user.
 * Helps track CTA-to-conversion rate on the upgrade screen.
 */
export function logPremiumUpgradeCtaShown(params?: { source?: string; tier?: string }) {
  logEvent('premium_upgrade_cta_shown', (params ?? {}) as Record<string, string | number | boolean>);
}

/**
 * Partner monetisation: a partner activates an OrbPilot campaign.
 * Tracks B2B product adoption — the key leading metric for OrbPilot ARR.
 */
export function logPartnerCampaignActivated(params: {
  partner_id: string;
  campaign_id: string;
  budget_dollars?: number;
}) {
  logEvent('partner_campaign_activated', params as Record<string, string | number | boolean>);
}

/**
 * Viral loop: user shares a Proof Card to social media.
 * Tracks top-of-funnel organic acquisition from the social sharing feature.
 */
export function logProofShared(params: {
  proof_id: string;
  partner_id?: string;
  channel?: string;
}) {
  logEvent('proof_shared', params as Record<string, string | number | boolean>);
}
