/**
 * Partner revenue features: Hot Spot activation, Orb Signal market creation.
 * Production Hot Spot flow: create Stripe Checkout session → redirect → webhook writes Firestore.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';

const getF = () => getFunctions(app, 'us-central1');

export type ActivateHotspotPayload = { partnerId: string; durationHours: number };
export type ActivateHotspotResult = { success: boolean; hotspotId?: string; expiresAt?: number; message?: string };

export async function partnerActivateHotspot(payload: ActivateHotspotPayload): Promise<ActivateHotspotResult> {
  const fn = httpsCallable<ActivateHotspotPayload, ActivateHotspotResult>(getF(), 'partnerActivateHotspot');
  const result = await fn(payload);
  return result.data;
}

export type CreateOrbSignalMarketPayload = {
  partnerId: string;
  question: string;
  outcomes?: string[];
  endAt?: number;
};
export type CreateOrbSignalMarketResult = { success: boolean; id?: string; message?: string };

export async function partnerCreateOrbSignalMarket(payload: CreateOrbSignalMarketPayload): Promise<CreateOrbSignalMarketResult> {
  const fn = httpsCallable<CreateOrbSignalMarketPayload, CreateOrbSignalMarketResult>(getF(), 'partnerCreateOrbSignalMarket');
  const result = await fn(payload);
  return result.data;
}
