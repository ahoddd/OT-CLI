/**
 * Fuse Engine Never Fails — always returns actionable outcomes.
 * Supply sources: live drops > missions > partners list > expand radius.
 */

import { useMemo } from 'react';
import type { Drop } from '../constants/Drops';
import type { DailyMission } from '../context/MissionsContext';
import { isMissionFullyComplete } from '../context/MissionsContext';
import type { Partner } from '../constants/MockData';
import { FUSE_MAX_RESULTS, FUSE_RADIUS_PRESETS_MI } from '../constants/OrbSwipeConfig';

export type FuseOutcomeType =
  | 'RESERVE_BEST_DROP'
  | 'NAVIGATE_CLOSEST_TRAY_ITEM'
  | 'NAVIGATE_CLOSEST_VERIFIED_PARTNER'
  | 'INDOOR_FALLBACK_PICK'
  | 'EXPAND_RADIUS_AND_RETRY';

export interface FuseOutcome {
  id: string;
  type: FuseOutcomeType;
  label: string;
  subLabel: string;
  partnerId?: string;
  partnerName?: string;
  dropId?: string;
  missionId?: string;
  route?: string;
}

export interface FuseEngineResult {
  outcomes: FuseOutcome[];
  hasSupply: boolean;
  noPicksActions: { label: string; action: 'expand' | 'switch_city' | 'map_picks' }[];
}

export function useFuseEngine(
  drops: Drop[],
  todayMissions: DailyMission[],
  partners: Partner[],
  currentRadiusMiles: number,
  trayPartnerIds: string[]
): FuseEngineResult {
  return useMemo(() => {
    const now = Date.now();
    const sixH = 6 * 60 * 60 * 1000;

    const liveDrops = drops.filter(
      (d) => d.qtyRemaining > 0 && d.endAt > now && d.startAt <= now + sixH
    );
    const incompleteMissions = todayMissions.filter(
      (m) => !isMissionFullyComplete(m) && m.deadlineAt > now
    );
    const verifiedPartners = partners.filter((p) => p.verified);

    const outcomes: FuseOutcome[] = [];

    if (liveDrops.length > 0) {
      const best = liveDrops.reduce((a, b) =>
        a.qtyRemaining > 0 && a.endAt < b.endAt ? a : b
      );
      outcomes.push({
        id: `fuse_reserve_${best.id}`,
        type: 'RESERVE_BEST_DROP',
        label: 'Reserve best drop',
        subLabel: `${best.partnerName} · ${best.title}`,
        partnerId: best.partnerId,
        partnerName: best.partnerName,
        dropId: best.id,
        route: `/drop/${best.id}?from=orbswipe`,
      });
    }

    if (trayPartnerIds.length > 0 && outcomes.length < FUSE_MAX_RESULTS) {
      const trayDrop = liveDrops.find((d) => trayPartnerIds.includes(d.partnerId));
      const trayMission = incompleteMissions.find(
        (m) => m.partnerId && trayPartnerIds.includes(m.partnerId)
      );
      const trayPartner = partners.find((p) => trayPartnerIds.includes(p.id));
      if (trayDrop) {
        outcomes.push({
          id: `fuse_tray_drop_${trayDrop.id}`,
          type: 'NAVIGATE_CLOSEST_TRAY_ITEM',
          label: 'Navigate to tray pick',
          subLabel: `${trayDrop.partnerName} · Drop live now`,
          partnerId: trayDrop.partnerId,
          partnerName: trayDrop.partnerName,
          dropId: trayDrop.id,
          route: `/drop/${trayDrop.id}?from=orbswipe`,
        });
      } else if (trayMission) {
        outcomes.push({
          id: `fuse_tray_mission_${trayMission.id}`,
          type: 'NAVIGATE_CLOSEST_TRAY_ITEM',
          label: 'Start tray mission',
          subLabel: trayMission.title,
          partnerId: trayMission.partnerId ?? undefined,
          missionId: trayMission.id,
          route: '/missions',
        });
      } else if (trayPartner) {
        outcomes.push({
          id: `fuse_tray_partner_${trayPartner.id}`,
          type: 'NAVIGATE_CLOSEST_TRAY_ITEM',
          label: `Navigate to ${trayPartner.name}`,
          subLabel: trayPartner.category,
          partnerId: trayPartner.id,
          partnerName: trayPartner.name,
          route: `/partner/${trayPartner.id}?from=orbswipe`,
        });
      }
    }

    if (outcomes.length < FUSE_MAX_RESULTS && verifiedPartners.length > 0) {
      const pick = verifiedPartners[0];
      if (!outcomes.some((o) => o.partnerId === pick.id)) {
        outcomes.push({
          id: `fuse_partner_${pick.id}`,
          type: 'NAVIGATE_CLOSEST_VERIFIED_PARTNER',
          label: `Visit ${pick.name}`,
          subLabel: `Verified · ${pick.category}`,
          partnerId: pick.id,
          partnerName: pick.name,
          route: `/partner/${pick.id}?from=orbswipe`,
        });
      }
    }

    const hasSupply = outcomes.length > 0;

    if (!hasSupply) {
      const canExpand =
        FUSE_RADIUS_PRESETS_MI.indexOf(
          currentRadiusMiles as (typeof FUSE_RADIUS_PRESETS_MI)[number]
        ) < FUSE_RADIUS_PRESETS_MI.length - 1;
      if (canExpand) {
        outcomes.push({
          id: 'fuse_expand_radius',
          type: 'EXPAND_RADIUS_AND_RETRY',
          label: 'Expand radius and retry',
          subLabel: 'Look further for picks',
        });
      }
    }

    const noPicksActions: FuseEngineResult['noPicksActions'] = [
      { label: 'Expand radius', action: 'expand' as const },
      { label: 'Pick a city', action: 'switch_city' as const },
      { label: 'See top partners on map', action: 'map_picks' as const },
    ];

    return {
      outcomes: outcomes.slice(0, FUSE_MAX_RESULTS),
      hasSupply,
      noPicksActions,
    };
  }, [drops, todayMissions, partners, currentRadiusMiles, trayPartnerIds]);
}
