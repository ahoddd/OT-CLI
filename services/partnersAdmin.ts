import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';
import type { Partner, Perk } from '../constants/MockData';

const getF = () => getFunctions(app, 'us-central1');

export type PartnerPayload = Omit<Partner, 'id'> & { id: string };
export type PerkPayload = Omit<Perk, 'id'> & { id: string };

export async function createPartner(data: PartnerPayload): Promise<{ success: boolean; id?: string; message?: string }> {
  const fn = httpsCallable<PartnerPayload, { success: boolean; id?: string; message?: string }>(getF(), 'adminCreatePartner');
  const result = await fn(data);
  return result.data;
}

export async function updatePartner(data: PartnerPayload): Promise<{ success: boolean; id?: string; message?: string }> {
  const fn = httpsCallable<PartnerPayload, { success: boolean; id?: string; message?: string }>(getF(), 'adminUpdatePartner');
  const result = await fn(data);
  return result.data;
}

export async function createPerk(data: PerkPayload): Promise<{ success: boolean; id?: string; message?: string }> {
  const fn = httpsCallable<PerkPayload, { success: boolean; id?: string; message?: string }>(getF(), 'adminCreatePerk');
  const result = await fn(data);
  return result.data;
}

export async function updatePerk(data: PerkPayload): Promise<{ success: boolean; id?: string; message?: string }> {
  const fn = httpsCallable<PerkPayload, { success: boolean; id?: string; message?: string }>(getF(), 'adminUpdatePerk');
  const result = await fn(data);
  return result.data;
}
