/**
 * OrbOps™ — Work order API via Firebase callables.
 * Server-authoritative; all mutations go through Cloud Functions.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export interface WorkOrderPayload {
  id: string;
  requesterUid: string;
  partnerId: string;
  category: string;
  title: string;
  description?: string;
  status: string;
  schedule?: { proposedTimes?: number[]; confirmedStartAt?: number; confirmedEndAt?: number };
  milestones?: Array<{ type: string; createdAt: number; completedAt?: number; notes?: string }>;
  createdAt: number;
  updatedAt: number;
}

export interface PartnerProofPortfolioPayload {
  partnerId: string;
  verifiedJobs30d: number;
  verifiedJobs90d: number;
  categoriesTop: string[];
  featuredProofTiles?: Array<{ receiptId: string; summaryLine: string; completedAt: number }>;
}

export async function createWorkOrder(params: {
  partnerId: string;
  category: string;
  title: string;
  description?: string;
  intakeTemplateId?: string;
  intakeAnswers?: Record<string, string | number | boolean>;
  cityId?: string;
}): Promise<{ success: true; workOrder: WorkOrderPayload } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'createWorkOrder');
    const res = await fn(params);
    const data = res.data as { success?: boolean; workOrder?: WorkOrderPayload; message?: string };
    if (data?.success && data?.workOrder) return { success: true, workOrder: data.workOrder };
    return { success: false, message: data?.message ?? 'Failed to create' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error';
    const isNotFound = /not-found|NOT_FOUND|not found/i.test(msg);
    return { success: false, message: isNotFound ? 'Work order service unavailable. Your request was saved locally.' : msg };
  }
}

export async function getWorkOrder(id: string): Promise<{ success: true; workOrder: WorkOrderPayload } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'getWorkOrder');
    const res = await fn({ id });
    const data = res.data as { success?: boolean; workOrder?: WorkOrderPayload; message?: string };
    if (data?.success && data?.workOrder) return { success: true, workOrder: data.workOrder };
    return { success: false, message: data?.message ?? 'Not found' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function listWorkOrders(role: 'customer' | 'partner', limit?: number): Promise<{ success: true; workOrders: WorkOrderPayload[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: true, workOrders: [] };
  try {
    const fn = httpsCallable(f, 'listWorkOrders');
    const res = await fn({ role, limit: limit ?? 30 });
    const data = res.data as { success?: boolean; workOrders?: WorkOrderPayload[]; message?: string };
    if (data?.success) return { success: true, workOrders: data.workOrders ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: true, workOrders: [] };
  }
}

export async function acceptWorkOrder(id: string, proposedTimes?: number[]): Promise<{ success: true; workOrder?: WorkOrderPayload } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'acceptWorkOrder');
    const res = await fn({ id, proposedTimes });
    const data = res.data as { success?: boolean; workOrder?: WorkOrderPayload; message?: string };
    if (data?.success) return { success: true, workOrder: data.workOrder };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function clarifyWorkOrder(id: string, message: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'clarifyWorkOrder');
    const res = await fn({ id, message });
    const data = res.data as { success?: boolean; message?: string };
    return { success: !!data?.success, message: data?.message };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function scheduleWorkOrder(id: string, confirmedStartAt?: number, confirmedEndAt?: number): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'scheduleWorkOrder');
    const res = await fn({ id, confirmedStartAt, confirmedEndAt });
    const data = res.data as { success?: boolean; message?: string };
    return { success: !!data?.success, message: data?.message };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function submitMilestone(id: string, milestoneType: 'EN_ROUTE' | 'STARTED' | 'MIDPOINT_PROOF', clientNonce: string, notes?: string, mediaRefs?: string[]): Promise<{ success: boolean; workOrder?: WorkOrderPayload; message?: string; idempotent?: boolean }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'submitMilestone');
    const res = await fn({ id, milestoneType, clientNonce, notes, mediaRefs });
    const data = res.data as { success?: boolean; workOrder?: WorkOrderPayload; message?: string; idempotent?: boolean };
    return { success: !!data?.success, workOrder: data?.workOrder, message: data?.message, idempotent: data?.idempotent };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function submitCompletion(id: string, clientNonce: string, params: { afterMediaRefs?: string[]; summaryLine?: string; checklistResults?: Record<string, boolean> }): Promise<{ success: boolean; proofPackId?: string; disputeWindowEndsAt?: number; message?: string; idempotent?: boolean }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'submitCompletion');
    const res = await fn({ id, clientNonce, ...params });
    const data = res.data as { success?: boolean; proofPackId?: string; disputeWindowEndsAt?: number; message?: string; idempotent?: boolean };
    return { success: !!data?.success, proofPackId: data?.proofPackId, disputeWindowEndsAt: data?.disputeWindowEndsAt, message: data?.message, idempotent: data?.idempotent };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function approveWorkOrder(id: string, clientNonce: string): Promise<{ success: true; actionId: string; receiptId: string; pointsAwarded: number } | { success: false; message: string } & { idempotent?: boolean }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'approveWorkOrder');
    const res = await fn({ id, clientNonce });
    const data = res.data as { success?: boolean; actionId?: string; receiptId?: string; pointsAwarded?: number; message?: string; idempotent?: boolean };
    if (data?.success && data?.actionId) return { success: true, actionId: data.actionId, receiptId: data.receiptId ?? '', pointsAwarded: data.pointsAwarded ?? 60 };
    return { success: false, message: data?.message ?? 'Failed', idempotent: data?.idempotent };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function cancelWorkOrder(id: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'cancelWorkOrder');
    const res = await fn({ id });
    const data = res.data as { success?: boolean; message?: string };
    return { success: !!data?.success, message: data?.message };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function disputeWorkOrder(id: string, reason: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const fn = httpsCallable(f, 'disputeWorkOrder');
    const res = await fn({ id, reason });
    const data = res.data as { success?: boolean; message?: string };
    return { success: !!data?.success, message: data?.message };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function getPartnerProofPortfolio(partnerId: string): Promise<{ success: true; portfolio: PartnerProofPortfolioPayload } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f) return { success: false, message: 'Functions unavailable' };
  try {
    const fn = httpsCallable(f, 'getPartnerProofPortfolio');
    const res = await fn({ partnerId });
    const data = res.data as { success?: boolean; portfolio?: PartnerProofPortfolioPayload; message?: string };
    if (data?.success && data?.portfolio) return { success: true, portfolio: data.portfolio };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}
