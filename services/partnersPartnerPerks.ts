/**
 * Partner self-service: create and update perks. Owner-only.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';
import type { Perk } from '../constants/MockData';
import type { PartnerTier } from '../constants/PartnerTiers';

const getF = () => getFunctions(app, 'us-central1');

export type PartnerCreatePerkPayload = {
  partnerId: string;
  title: string;
  description?: string;
  cost: number;
  tier: PartnerTier;
  cooldown?: string;
  imageUrl?: string;
};

export type PartnerUpdatePerkPayload = {
  perkId: string;
  partnerId: string;
  title?: string;
  description?: string;
  cost?: number;
  tier?: PartnerTier;
  cooldown?: string;
  imageUrl?: string;
  active?: boolean;
};

export async function partnerCreatePerk(
  payload: PartnerCreatePerkPayload
): Promise<{ success: boolean; id?: string; message?: string }> {
  const fn = httpsCallable<PartnerCreatePerkPayload, { success: boolean; id?: string; message?: string }>(
    getF(),
    'partnerCreatePerk'
  );
  const result = await fn(payload);
  return result.data;
}

export async function partnerUpdatePerk(
  payload: PartnerUpdatePerkPayload
): Promise<{ success: boolean; message?: string }> {
  const fn = httpsCallable<PartnerUpdatePerkPayload, { success: boolean; message?: string }>(
    getF(),
    'partnerUpdatePerk'
  );
  const result = await fn(payload);
  return result.data;
}
