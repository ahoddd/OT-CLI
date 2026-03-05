/**
 * Fuse My Night — generate 1–3 actionable options from tray + live drops + missions.
 */

import { useMemo } from 'react';
import type { Drop } from '../constants/Drops';
import type { DailyMission } from '../context/MissionsContext';
import { isMissionFullyComplete } from '../context/MissionsContext';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';

export type FuseOptionType = 'drop' | 'mission' | 'navigate';

export interface FuseOption {
  id: string;
  type: FuseOptionType;
  label: string;
  subLabel: string;
  dropId?: string;
  missionId?: string;
  partnerId?: string;
}

export function useFuseOptions(
  trayCards: OrbSwipeCard[],
  drops: Drop[],
  todayMissions: DailyMission[]
): FuseOption[] {
  return useMemo(() => {
    const now = Date.now();
    const liveDrops = drops.filter((d) => d.qtyRemaining > 0 && d.endAt > now && d.startAt <= now + 6 * 60 * 60 * 1000);
    const incompleteMissions = todayMissions.filter((m) => !isMissionFullyComplete(m) && m.deadlineAt > now);

    const options: FuseOption[] = [];

    const dropIdsInTray = new Set(trayCards.filter((c): c is OrbSwipeCard & { dropId: string } => 'dropId' in c && c.type === 'DROP_CARD').map((c) => (c as { dropId: string }).dropId));
    const missionIdsInTray = new Set(trayCards.filter((c): c is OrbSwipeCard & { missionId: string } => 'missionId' in c && c.type === 'MISSION_CARD').map((c) => (c as { missionId: string }).missionId));

    const trayDropsOrdered = liveDrops.filter((d) => dropIdsInTray.has(d.id));
    const trayMissions = incompleteMissions.filter((m) => missionIdsInTray.has(m.id));

    const bestDropInTray = trayDropsOrdered.length > 0
      ? trayDropsOrdered.reduce((a, b) =>
          (a.qtyRemaining > 0 && (b.qtyRemaining === 0 || a.endAt > b.endAt)) || a.qtyRemaining > b.qtyRemaining ? a : b
        )
      : null;
    if (bestDropInTray) {
      options.push({
        id: `fuse_drop_${bestDropInTray.id}`,
        type: 'drop',
        label: '1-Click Win',
        subLabel: `Reserve at ${bestDropInTray.partnerName} now`,
        dropId: bestDropInTray.id,
        partnerId: bestDropInTray.partnerId,
      });
    }

    if (trayDropsOrdered.length >= 2 || (trayDropsOrdered.length >= 1 && trayMissions.length >= 1)) {
      const firstDrop = trayDropsOrdered[0] ?? null;
      const secondDrop = trayDropsOrdered[1] ?? null;
      const firstMission = trayMissions[0] ?? null;
      const secondLabel = secondDrop ? secondDrop.partnerName : firstMission ? firstMission.title : '';
      if (firstDrop && secondLabel && !options.some((o) => o.dropId === firstDrop.id)) {
        options.push({
          id: 'fuse_2stop',
          type: 'drop',
          label: '2-Stop Plan',
          subLabel: `${firstDrop.partnerName} → ${secondLabel}`,
          dropId: firstDrop.id,
          partnerId: firstDrop.partnerId,
        });
      }
    }

    const budgetDrop = trayDropsOrdered.filter((d) => (d.reserveFeePoints ?? 0) <= 10).sort((a, b) => (a.reserveFeePoints ?? 0) - (b.reserveFeePoints ?? 0))[0];
    if (budgetDrop && !options.some((o) => o.dropId === budgetDrop.id)) {
      options.push({
        id: `fuse_budget_${budgetDrop.id}`,
        type: 'drop',
        label: 'Budget Route',
        subLabel: `${budgetDrop.partnerName} · ${budgetDrop.reserveFeePoints === 0 ? 'Free' : `${budgetDrop.reserveFeePoints} OT`} reserve`,
        dropId: budgetDrop.id,
        partnerId: budgetDrop.partnerId,
      });
    }

    return options.slice(0, 3);
  }, [trayCards, drops, todayMissions]);
}

export interface FusedPlanStop {
  order: number;
  type: 'drop' | 'mission' | 'partner';
  dropId?: string;
  missionId?: string;
  partnerId: string;
  partnerName: string;
  label: string;
  subLabel: string;
  route: string;
  pointsPotential: number;
  urgency?: string;
}

export interface FusedPlan {
  stops: FusedPlanStop[];
  totalPointsPotential: number;
}

export function useFusedPlan(
  trayCards: OrbSwipeCard[],
  drops: Drop[],
  todayMissions: DailyMission[]
): FusedPlan {
  return useMemo(() => {
    const now = Date.now();
    const stops: FusedPlanStop[] = [];

    const ordered = [...trayCards].sort((a, b) => {
      if (a.type === 'DROP_CARD' && b.type !== 'DROP_CARD') return -1;
      if (a.type !== 'DROP_CARD' && b.type === 'DROP_CARD') return 1;
      if (a.type === 'DROP_CARD' && b.type === 'DROP_CARD') {
        const dropA = 'dropId' in a ? drops.find(d => d.id === (a as any).dropId) : null;
        const dropB = 'dropId' in b ? drops.find(d => d.id === (b as any).dropId) : null;
        return (dropA?.endAt ?? Infinity) - (dropB?.endAt ?? Infinity);
      }
      if (a.type === 'MISSION_CARD' && b.type !== 'MISSION_CARD') return -1;
      if (a.type !== 'MISSION_CARD' && b.type === 'MISSION_CARD') return 1;
      return 0;
    });

    ordered.forEach((card, idx) => {
      const drop = card.type === 'DROP_CARD' && 'dropId' in card
        ? drops.find(d => d.id === (card as any).dropId)
        : null;
      const mission = card.type === 'MISSION_CARD' && 'missionId' in card
        ? todayMissions.find(m => m.id === (card as any).missionId)
        : null;

      let urgency: string | undefined;
      if (drop) {
        const remaining = drop.endAt - now;
        if (remaining < 60 * 60 * 1000) urgency = 'Ends in <1h';
        else if (drop.qtyRemaining <= 3) urgency = `${drop.qtyRemaining} left`;
      }

      stops.push({
        order: idx + 1,
        type: drop ? 'drop' : mission ? 'mission' : 'partner',
        dropId: drop?.id,
        missionId: mission?.id,
        partnerId: card.partnerId,
        partnerName: card.partnerName,
        label: drop?.title ?? mission?.title ?? card.valueSummary,
        subLabel: drop
          ? `Reserve · ${drop.reserveFeePoints === 0 ? 'Free' : `${drop.reserveFeePoints} OT`}`
          : mission
          ? mission.description
          : card.distanceLabel,
        route: drop
          ? `/drop/${drop.id}?from=orbswipe`
          : mission
          ? '/missions'
          : `/partner/${card.partnerId}?from=orbswipe`,
        pointsPotential: mission?.rewardPoints ?? 25,
        urgency,
      });
    });

    return {
      stops,
      totalPointsPotential: stops.reduce((sum, s) => sum + s.pointsPotential, 0),
    };
  }, [trayCards, drops, todayMissions]);
}
