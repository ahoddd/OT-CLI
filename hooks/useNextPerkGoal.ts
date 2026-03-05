/**
 * Shared hook: next perk goal (earn X more or you can redeem).
 * Used by Wallet card, Map/Orb header for progress visibility.
 */

import { useMemo } from 'react';
import { useWallet } from './useWallet';
import { usePartners } from '../context/PartnersContext';

export interface NextPerkGoalEarn {
  type: 'earn';
  gap: number;
  perk: { title: string; cost: number; partnerId: string };
  partnerName: string;
}

export interface NextPerkGoalRedeem {
  type: 'redeem';
  perk: { title: string; cost: number; partnerId: string };
  partnerName: string;
}

export type NextPerkGoal = NextPerkGoalEarn | NextPerkGoalRedeem | null;

export function useNextPerkGoal(): NextPerkGoal {
  const { balance } = useWallet();
  const { perks, getPartner } = usePartners();

  return useMemo(() => {
    const perksByCost = [...perks].sort((a, b) => a.cost - b.cost);
    const above = perksByCost.find((p) => p.cost > balance);
    const below = perksByCost.filter((p) => p.cost <= balance).pop();
    if (above) {
      const partner = getPartner(above.partnerId);
      return {
        type: 'earn',
        gap: above.cost - balance,
        perk: above,
        partnerName: partner?.name ?? 'a partner',
      };
    }
    if (below && balance > 0) {
      const partner = getPartner(below.partnerId);
      return {
        type: 'redeem',
        perk: below,
        partnerName: partner?.name ?? 'a partner',
      };
    }
    return null;
  }, [balance, perks, getPartner]);
}
