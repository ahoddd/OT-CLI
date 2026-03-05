/**
 * OrbOps™ — Work orders hook. Uses server callables; caches list locally.
 * When the API is unavailable (not-found / not signed in), create and getOne use a local fallback so the flow still works.
 */

import { useState, useCallback, useEffect } from 'react';
import * as orbOps from '../services/orbOps';
import type { WorkOrderPayload, PartnerProofPortfolioPayload } from '../services/orbOps';
import { auth } from '../firebaseConfig';

const localWorkOrdersMap = new Map<string, WorkOrderPayload>();

export type WorkOrderRole = 'customer' | 'partner';

export interface UseWorkOrdersResult {
  workOrders: WorkOrderPayload[];
  loading: boolean;
  error: string | null;
  create: (params: Parameters<typeof orbOps.createWorkOrder>[0]) => Promise<{ success: boolean; workOrder?: WorkOrderPayload; message?: string }>;
  getOne: (id: string) => Promise<{ success: boolean; workOrder?: WorkOrderPayload; message?: string }>;
  list: (role: WorkOrderRole) => Promise<void>;
  accept: (id: string, proposedTimes?: number[]) => Promise<{ success: boolean; message?: string }>;
  clarify: (id: string, message: string) => Promise<{ success: boolean; message?: string }>;
  schedule: (id: string, confirmedStartAt?: number, confirmedEndAt?: number) => Promise<{ success: boolean; message?: string }>;
  submitMilestone: (id: string, type: 'EN_ROUTE' | 'STARTED' | 'MIDPOINT_PROOF', clientNonce: string, notes?: string, mediaRefs?: string[]) => Promise<{ success: boolean; message?: string }>;
  submitCompletion: (id: string, clientNonce: string, params: { afterMediaRefs?: string[]; summaryLine?: string; checklistResults?: Record<string, boolean> }) => Promise<{ success: boolean; proofPackId?: string; message?: string }>;
  approve: (id: string, clientNonce: string) => Promise<{ success: boolean; actionId?: string; receiptId?: string; pointsAwarded?: number; message?: string }>;
  dispute: (id: string, reason: string) => Promise<{ success: boolean; message?: string }>;
  cancel: (id: string) => Promise<{ success: boolean; message?: string }>;
  refresh: () => Promise<void>;
  role: WorkOrderRole;
  setRole: (r: WorkOrderRole) => void;
}

export function useWorkOrders(initialRole: WorkOrderRole = 'customer'): UseWorkOrdersResult {
  const [workOrders, setWorkOrders] = useState<WorkOrderPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<WorkOrderRole>(initialRole);

  const list = useCallback(async (r: WorkOrderRole) => {
    setLoading(true);
    setError(null);
    const res = await orbOps.listWorkOrders(r);
    if (res.success) setWorkOrders(res.workOrders);
    else setError(res.message ?? 'Failed to load');
    setLoading(false);
  }, []);

  const refresh = useCallback(() => list(role), [list, role]);

  useEffect(() => {
    list(role);
  }, [role]);

  const create = useCallback(async (params: Parameters<typeof orbOps.createWorkOrder>[0]) => {
    const res = await orbOps.createWorkOrder(params);
    if (res.success && res.workOrder) {
      setWorkOrders((prev) => [res.workOrder!, ...prev]);
      return { success: true, workOrder: res.workOrder };
    }
    const msg = !res.success && 'message' in res ? res.message ?? '' : '';
    const useLocalFallback = /not-found|NOT_FOUND|not found|Not signed in|Network error|unavailable|saved locally/i.test(msg);
    if (useLocalFallback) {
      const uid = auth.currentUser?.uid ?? 'anonymous';
      const id = `local_wo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();
      const localWo: WorkOrderPayload = {
        id,
        requesterUid: uid,
        partnerId: params.partnerId,
        category: params.category,
        title: params.title,
        description: params.description,
        status: 'REQUESTED',
        createdAt: now,
        updatedAt: now,
      };
      localWorkOrdersMap.set(id, localWo);
      setWorkOrders((prev) => [localWo, ...prev]);
      return { success: true, workOrder: localWo };
    }
    return { success: false, message: !res.success && 'message' in res ? res.message : 'Unknown error' };
  }, []);

  const getOne = useCallback(async (id: string) => {
    const local = localWorkOrdersMap.get(id);
    if (local) return { success: true, workOrder: local };
    return orbOps.getWorkOrder(id);
  }, []);

  const accept = useCallback(async (id: string, proposedTimes?: number[]) => {
    const res = await orbOps.acceptWorkOrder(id, proposedTimes);
    if (res.success) await list(role);
    return { success: res.success, message: res.success ? undefined : ('message' in res ? res.message : undefined) };
  }, [list, role]);

  const clarify = useCallback(async (id: string, message: string) => {
    const res = await orbOps.clarifyWorkOrder(id, message);
    if (res.success) await list(role);
    return res;
  }, [list, role]);

  const schedule = useCallback(async (id: string, confirmedStartAt?: number, confirmedEndAt?: number) => {
    const res = await orbOps.scheduleWorkOrder(id, confirmedStartAt, confirmedEndAt);
    if (res.success) await list(role);
    return res;
  }, [list, role]);

  const submitMilestone = useCallback(async (id: string, type: 'EN_ROUTE' | 'STARTED' | 'MIDPOINT_PROOF', clientNonce: string, notes?: string, mediaRefs?: string[]) => {
    const res = await orbOps.submitMilestone(id, type, clientNonce, notes, mediaRefs);
    if (res.success) await list(role);
    return { success: res.success, message: res.message };
  }, [list, role]);

  const submitCompletion = useCallback(async (id: string, clientNonce: string, params: { afterMediaRefs?: string[]; summaryLine?: string; checklistResults?: Record<string, boolean> }) => {
    const res = await orbOps.submitCompletion(id, clientNonce, params);
    if (res.success) await list(role);
    return { success: res.success, proofPackId: res.proofPackId, message: res.message };
  }, [list, role]);

  const approve = useCallback(async (id: string, clientNonce: string) => {
    const res = await orbOps.approveWorkOrder(id, clientNonce);
    if (res.success) await list(role);
    return { success: res.success, actionId: res.success ? res.actionId : undefined, receiptId: res.success ? res.receiptId : undefined, pointsAwarded: res.success ? res.pointsAwarded : undefined, message: res.success ? undefined : res.message };
  }, [list, role]);

  const dispute = useCallback(async (id: string, reason: string) => {
    const res = await orbOps.disputeWorkOrder(id, reason);
    if (res.success) await list(role);
    return res;
  }, [list, role]);

  const cancel = useCallback(async (id: string) => {
    const res = await orbOps.cancelWorkOrder(id);
    if (res.success) await list(role);
    return res;
  }, [list, role]);

  return {
    workOrders,
    loading,
    error,
    create,
    getOne,
    list,
    accept,
    clarify,
    schedule,
    submitMilestone,
    submitCompletion,
    approve,
    dispute,
    cancel,
    refresh,
    role,
    setRole,
  };
}

export function usePartnerProofPortfolio(partnerId: string | null): { portfolio: PartnerProofPortfolioPayload | null; loading: boolean } {
  const [portfolio, setPortfolio] = useState<PartnerProofPortfolioPayload | null>(null);
  const [loading, setLoading] = useState(!!partnerId);
  useEffect(() => {
    if (!partnerId) {
      setPortfolio(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    orbOps.getPartnerProofPortfolio(partnerId).then((res) => {
      if (res.success) setPortfolio(res.portfolio);
      else setPortfolio(null);
      setLoading(false);
    });
  }, [partnerId]);
  return { portfolio, loading };
}
