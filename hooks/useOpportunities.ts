/**
 * OrbOpportunities — browse, apply, partner manage, receipts, export.
 * Uses mock store from constants/Opportunities; swap for API later.
 */

import { useMemo, useState, useCallback } from 'react';
import {
  getMockOpportunities,
  getMockApplications,
  getMockReceipts,
  addMockOpportunity,
  updateMockOpportunity,
  addMockApplication,
  updateMockApplication,
  addMockReceipt,
  recordNoShow,
  canUserApply,
  seedMockOpportunitiesIfEmpty,
  type Opportunity,
  type OpportunityApplication,
  type WorkReceipt,
  type OpportunityType,
  type OpportunityStatus,
  type ApplicationStatus,
  type CompensationDisclosure,
  NO_SHOW_RESTRICT_THRESHOLD,
  NO_SHOW_LOOKBACK_DAYS,
} from '../constants/Opportunities';

export type SortOption = 'newest' | 'soonest' | 'closest';

export function useOpportunities(options?: { type?: OpportunityType; sort?: SortOption }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const opportunities = useMemo(() => {
    const list = getMockOpportunities().filter((o) => o.status === 'PUBLISHED');
    let out = options?.type ? list.filter((o) => o.type === options.type) : list;
    const sort = options?.sort ?? 'newest';
    if (sort === 'newest') out = [...out].sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'soonest') out = [...out].sort((a, b) => a.startAt - b.startAt);
    return out;
  }, [refreshKey, options?.type, options?.sort]);

  return { opportunities, loading: false, refresh };
}

export function usePartnerOpportunities(partnerId: string | null) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const opportunities = useMemo(() => {
    if (!partnerId) return [];
    seedMockOpportunitiesIfEmpty(partnerId);
    return getMockOpportunities()
      .filter((o) => o.partnerId === partnerId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [partnerId, refreshKey]);

  return { opportunities, loading: false, refresh };
}

/** Count of SUBMITTED applications for partner's opportunities (for dashboard badge). */
export function usePartnerPendingApplicationsCount(partnerId: string | null): number {
  const { opportunities } = usePartnerOpportunities(partnerId);
  return useMemo(() => {
    if (!partnerId) return 0;
    const oppIds = new Set(opportunities.map((o) => o.id));
    return getMockApplications().filter(
      (a) => oppIds.has(a.opportunityId) && a.status === 'SUBMITTED'
    ).length;
  }, [partnerId, opportunities]);
}

export function useMyApplications(userId: string | null) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const applications = useMemo(() => {
    if (!userId) return [];
    return getMockApplications()
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [userId, refreshKey]);

  return { applications, loading: false, refresh };
}

export function useOpportunityById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    return getMockOpportunities().find((o) => o.id === id) ?? null;
  }, [id]);
}

export function useApplicationsForOpportunity(opportunityId: string | null) {
  return useMemo(() => {
    if (!opportunityId) return [];
    return getMockApplications()
      .filter((a) => a.opportunityId === opportunityId)
      .sort((a, b) => a.submittedAt - b.submittedAt);
  }, [opportunityId]);
}

export function useMyReceipts(userId: string | null) {
  return useMemo(() => {
    if (!userId) return [];
    return getMockReceipts()
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.verifiedAt - a.verifiedAt);
  }, [userId]);
}

export function useCanApply(userId: string | null): boolean {
  return useMemo(() => (userId ? canUserApply(userId) : false), [userId]);
}

export function useApply(
  userId: string | null,
  onDone?: () => void
): (opportunityId: string, availability?: string, note?: string) => Promise<{ success: boolean; message?: string }> {
  return useCallback(
    async (opportunityId: string, availability?: string, note?: string) => {
      if (!userId) return { success: false, message: 'Not signed in' };
      if (!canUserApply(userId)) {
        return {
          success: false,
          message: `Applying is temporarily restricted due to no-shows (${NO_SHOW_RESTRICT_THRESHOLD}+ in ${NO_SHOW_LOOKBACK_DAYS} days).`,
        };
      }
      const opp = getMockOpportunities().find((o) => o.id === opportunityId);
      if (!opp || opp.status !== 'PUBLISHED') return { success: false, message: 'Opportunity not available' };
      const existing = getMockApplications().find(
        (a) => a.opportunityId === opportunityId && a.userId === userId && !['REJECTED', 'WITHDRAWN'].includes(a.status)
      );
      if (existing) return { success: false, message: 'Already applied' };
      if (opp.capacity != null) {
        const accepted = getMockApplications().filter(
          (a) => a.opportunityId === opportunityId && a.status === 'ACCEPTED'
        ).length;
        if (accepted >= opp.capacity) return { success: false, message: 'No slots left' };
      }
      addMockApplication({
        opportunityId,
        userId,
        availability: availability?.slice(0, 200),
        note: note?.slice(0, 500),
        status: 'SUBMITTED',
      });
      onDone?.();
      return { success: true };
    },
    [userId, onDone]
  );
}

export function useWithdrawApplication(
  userId: string | null,
  onDone?: () => void
): (applicationId: string) => Promise<{ success: boolean; message?: string }> {
  return useCallback(
    async (applicationId: string) => {
      if (!userId) return { success: false, message: 'Not signed in' };
      const app = getMockApplications().find((a) => a.id === applicationId && a.userId === userId);
      if (!app) return { success: false, message: 'Application not found' };
      if (app.status === 'WITHDRAWN' || app.status === 'REJECTED') return { success: false, message: 'Already withdrawn or rejected' };
      updateMockApplication(applicationId, { status: 'WITHDRAWN', withdrawnAt: Date.now() });
      onDone?.();
      return { success: true };
    },
    [userId, onDone]
  );
}

export function useCreateOpportunity(partnerId: string | null, onDone?: () => void) {
  return useCallback(
    (params: {
      title: string;
      type: Opportunity['type'];
      startAt: number;
      durationHours?: number;
      compensation: CompensationDisclosure;
      capacity?: number;
      requirementsTags: string[];
      locationRef?: Opportunity['locationRef'];
      locationId?: string;
    }) => {
      if (!partnerId) return null;
      const opp = addMockOpportunity({
        partnerId,
        createdByPartnerId: partnerId,
        locationId: params.locationId,
        title: params.title,
        type: params.type,
        status: 'DRAFT',
        startAt: params.startAt,
        durationHours: params.durationHours,
        compensation: params.compensation,
        capacity: params.capacity,
        requirementsTags: params.requirementsTags,
        locationRef: params.locationRef,
      });
      onDone?.();
      return opp;
    },
    [partnerId, onDone]
  );
}

export function usePublishOpportunity(onDone?: () => void) {
  return useCallback(
    (id: string) => {
      const now = Date.now();
      return updateMockOpportunity(id, { status: 'PUBLISHED', publishedAt: now });
    },
    [onDone]
  );
}

export function useUpdateApplicationStatus(opportunityId: string, onDone?: () => void) {
  return useCallback(
    (applicationId: string, status: ApplicationStatus) => {
      const updates: Partial<OpportunityApplication> = { status };
      const now = Date.now();
      if (status === 'ACCEPTED') updates.acceptedAt = now;
      if (status === 'REJECTED') updates.rejectedAt = now;
      updates.reviewedAt = now;
      updateMockApplication(applicationId, updates);
      onDone?.();
    },
    [onDone]
  );
}

export function useVerifyCompletion(partnerId: string, onDone?: () => void) {
  return useCallback(
    (
      opportunityId: string,
      applicationId: string,
      userId: string,
      opportunityTitle: string,
      compensationSnapshot: CompensationDisclosure,
      hours?: number,
      locationId?: string,
      notes?: string
    ) => {
      const app = getMockApplications().find((a) => a.id === applicationId && a.status === 'ACCEPTED');
      if (!app) return null;
      const receipt = addMockReceipt({
        userId,
        partnerId,
        locationId,
        opportunityId,
        opportunityTitle,
        verifiedAt: Date.now(),
        hours,
        compensationSnapshot,
        verificationMethod: 'partner-confirm',
        notes,
      });
      onDone?.();
      return receipt;
    },
    [partnerId, onDone]
  );
}

export function useMarkNoShow(partnerId: string) {
  return useCallback((userId: string, _reason: string) => {
    recordNoShow(userId, 'no_show');
  }, []);
}

/** Export data for partner records (CSV/JSON). */
export function getExportOpportunities(partnerId: string, fromTs: number, toTs: number): Opportunity[] {
  return getMockOpportunities().filter(
    (o) => o.partnerId === partnerId && o.createdAt >= fromTs && o.createdAt <= toTs
  );
}

export function getExportApplications(partnerId: string, fromTs: number, toTs: number): OpportunityApplication[] {
  const oppIds = new Set(getMockOpportunities().filter((o) => o.partnerId === partnerId).map((o) => o.id));
  return getMockApplications().filter(
    (a) => oppIds.has(a.opportunityId) && a.submittedAt >= fromTs && a.submittedAt <= toTs
  );
}

export function getExportReceipts(partnerId: string, fromTs: number, toTs: number): WorkReceipt[] {
  return getMockReceipts().filter(
    (r) => r.partnerId === partnerId && r.verifiedAt >= fromTs && r.verifiedAt <= toTs
  );
}
