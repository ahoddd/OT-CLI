/**
 * Admin: list partner applications and approve/reject.
 * Uses Cloud Functions (admin only).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export interface PartnerApplicationRow {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  category: string | null;
  description: string;
  placementInterest: 'featured' | 'sponsored' | 'both';
  referredByCode: string | null;
  adPlacementPreference: 'orb_carousel' | 'daily_ritual_reward' | null;
  adCtaUrl: string | null;
  adCreativeType: 'image' | 'video' | null;
  adNotes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  createdAt: number;
  updatedAt: number;
}

function getF() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export async function listPartnerApplicationsAdmin(params?: { status?: 'pending' | 'approved' | 'rejected'; limit?: number }): Promise<
  { success: true; applications: PartnerApplicationRow[] } | { success: false; message: string }
> {
  const f = getF();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'listPartnerApplicationsAdmin')(params ?? {});
    const data = res.data as { success?: boolean; applications?: PartnerApplicationRow[]; message?: string };
    if (data?.success && Array.isArray(data.applications)) return { success: true, applications: data.applications };
    return { success: false, message: data?.message ?? 'Failed to load' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function updatePartnerApplicationStatus(applicationId: string, status: 'approved' | 'rejected', adminNote?: string): Promise<
  { success: true } | { success: false; message: string }
> {
  const f = getF();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'updatePartnerApplicationStatus')({ applicationId, status, adminNote: adminNote?.trim() || null });
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Update failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Admin: approve application (if pending) and create partner on map, link to applying user. Idempotent. */
export async function createPartnerFromApplication(applicationId: string): Promise<
  { success: true; partnerId?: string; message?: string } | { success: false; message: string }
> {
  const f = getF();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'createPartnerFromApplication')({ applicationId: applicationId.trim() });
    const data = res.data as { success?: boolean; message?: string; partnerId?: string };
    if (data?.success) return { success: true, partnerId: data.partnerId, message: data.message };
    return { success: false, message: data?.message ?? 'Failed to create partner' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}
