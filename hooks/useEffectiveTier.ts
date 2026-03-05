/**
 * Effective user tier for UI gating and CTAs — Sprint 13 update.
 *
 * Source of truth priority (highest → lowest):
 *   1. Admin "Test as" mode (UI-only override for admin accounts)
 *   2. Firestore users/{uid}.tier (set by Stripe webhook — server authoritative)
 *   3. Local preferences (prefs.premiumMember / prefs.partnerMode) as offline fallback
 *
 * Backend (auth claims, API) always uses real account — this is UI-only gating.
 */

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../hooks/usePreferences';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { isAdminEmail } from '../constants/Admin';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import type { TestAccountType } from '../constants/AdminConfig';
import type { PartnerTier } from '../constants/PartnerTiers';

export type EffectiveTier = 'free' | 'premium' | 'pro';

export interface EffectiveTierResult {
  tier: EffectiveTier;
  isPremium: boolean;
  isPro: boolean;
  /** Same as isPro: true only for partner/Pro accounts. Use to hide partner-only UI for regular users. */
  isPartner: boolean;
  /** True when admin is viewing app as another account type (test mode). */
  isTestMode: boolean;
  /** When testing as partner: silver | gold | platinum. Undefined when not testing as partner. */
  testPartnerTier?: PartnerTier;
  /** True while the Firestore tier is being fetched (first load only). */
  tierLoading: boolean;
}

function tierFromPrefs(premiumMember: boolean, partnerMode: boolean): EffectiveTier {
  if (partnerMode) return 'pro';
  if (premiumMember) return 'premium';
  return 'free';
}

function clampTier(raw: unknown): EffectiveTier | null {
  if (raw === 'premium' || raw === 'pro' || raw === 'free') return raw;
  return null;
}

export function useEffectiveTier(): EffectiveTierResult {
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const layout = useAdminLayout();
  const testAccountType = layout.testAccountType ?? 'off';
  const isAdmin = isAdminEmail(user?.email);

  // Firestore tier — server-of-truth set by Stripe webhook
  const [firestoreTier, setFirestoreTier] = useState<EffectiveTier | null>(null);
  const [tierLoading, setTierLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setFirestoreTier(null);
      setTierLoading(false);
      return;
    }
    setTierLoading(true);
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data()?.tier;
          setFirestoreTier(clampTier(raw));
        } else {
          setFirestoreTier(null);
        }
        setTierLoading(false);
      },
      () => {
        // Firestore unavailable (offline) — fall back to prefs
        setFirestoreTier(null);
        setTierLoading(false);
      },
    );
    return unsub;
  }, [user?.uid]);

  return useMemo((): EffectiveTierResult => {
    const useTest = isAdmin && testAccountType !== 'off';
    const isPartnerType =
      testAccountType === 'partner_silver' || testAccountType === 'partner_gold' || testAccountType === 'partner_platinum';

    let tier: EffectiveTier;
    if (useTest) {
      tier = isPartnerType ? 'pro' : (testAccountType as EffectiveTier);
    } else if (firestoreTier) {
      // Firestore is the Stripe-backed source of truth
      tier = firestoreTier;
    } else {
      // Offline fallback: local prefs
      tier = tierFromPrefs(prefs.premiumMember ?? false, prefs.partnerMode ?? false);
    }

    const testPartnerTier: PartnerTier | undefined =
      testAccountType === 'partner_silver'
        ? 'silver'
        : testAccountType === 'partner_gold'
          ? 'gold'
          : testAccountType === 'partner_platinum'
            ? 'platinum'
            : undefined;

    const isPartner = useTest ? isPartnerType : (prefs.partnerMode ?? false);

    return {
      tier,
      isPremium: tier === 'premium' || tier === 'pro',
      isPro: tier === 'pro',
      isPartner,
      isTestMode: useTest,
      testPartnerTier,
      tierLoading: !useTest && tierLoading,
    };
  }, [isAdmin, testAccountType, firestoreTier, tierLoading, prefs.premiumMember, prefs.partnerMode]);
}
