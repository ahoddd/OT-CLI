/**
 * OrbPulse™ — Live Pulse feed: trending now from verified actions only.
 * Pulse Boost: proof-based democracy (no likes/boosts).
 */

import { useMemo } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useDrops } from './useDrops';
import { useMenuContext } from '../context/MenuContext';
import { useFlags } from '../components/FlagContext';
import { scoreFromAction, type PulsePartnerRow } from '../constants/PulseScore';
import type { Drop } from '../constants/Drops';
import { usePartners } from '../context/PartnersContext';

const NOW = Date.now();
const NOW_WINDOW_MS = 60 * 60 * 1000;
const TODAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_N = 10;

export interface PulseTile {
  type: 'partner' | 'drop' | 'poll';
  id: string;
  title: string;
  category: string;
  whyTrending: string;
  /** For partner: partnerId. For drop: dropId. */
  entityId: string;
  /** For drop: qty remaining + timer. */
  qtyRemaining?: number;
  endAt?: number;
  /** True when drop ends within 2h (Tonight / Final Hours). */
  finalHours?: boolean;
  /** CTA: reserve_drop | start_quest | navigate | redeem | view | vote */
  primaryCta: string;
  score: number;
  drop?: Drop;
  /** For poll: pollId for deep link. */
  pollId?: string;
}

export interface UsePulseResult {
  /** Top tiles for Live Pulse feed (6 max for home module). */
  liveTiles: PulseTile[];
  /** Full ranked list for dedicated screen. */
  trendingPartnersNow: PulsePartnerRow[];
  trendingDropsNow: Drop[];
  newDiscoveries: PulsePartnerRow[];
  tonightPicks: PulseTile[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function usePulse(): UsePulseResult {
  const { verifiedActions } = useWalletContext();
  const { drops, loading: dropsLoading, refresh: refreshDrops } = useDrops();
  const { documents, getCurrentVersion } = useMenuContext();
  const { flags } = useFlags();
  const { getPartner } = usePartners();

  const now = Date.now();
  const oneHourAgo = now - NOW_WINDOW_MS;
  const twentyFourHoursAgo = now - TODAY_WINDOW_MS;
  const sevenDaysAgo = now - SEVEN_DAYS_MS;

  const { trendingPartnersNow, newDiscoveries, tonightPicksPartners } = useMemo(() => {
    const getPartnerName = (partnerId: string) => getPartner(partnerId)?.name ?? partnerId;
    const getPartnerCategory = (partnerId: string) => getPartner(partnerId)?.category ?? 'explore';
    const actionsIn24h = verifiedActions.filter((a) => a.createdAt >= twentyFourHoursAgo);
    const actionsIn1h = actionsIn24h.filter((a) => a.createdAt >= oneHourAgo);
    const actionsIn7d = verifiedActions.filter((a) => a.createdAt >= sevenDaysAgo);

    const partnerScores = new Map<string, { score: number; count: number; lastAt: number }>();
    for (const a of actionsIn1h) {
      const minutesAgo = (now - a.createdAt) / (60 * 1000);
      const add = scoreFromAction(a.pointsAwarded, minutesAgo, a.actionType ?? 'REDEEM');
      const cur = partnerScores.get(a.partnerId) ?? { score: 0, count: 0, lastAt: 0 };
      partnerScores.set(a.partnerId, {
        score: cur.score + add,
        count: cur.count + 1,
        lastAt: Math.max(cur.lastAt, a.createdAt),
      });
    }

    const trendingPartnersNow: PulsePartnerRow[] = Array.from(partnerScores.entries())
      .map(([partnerId, v]) => ({
        partnerId,
        partnerName: getPartnerName(partnerId),
        category: getPartnerCategory(partnerId),
        score: v.score,
        verifiedCount24h: actionsIn24h.filter((x) => x.partnerId === partnerId).length,
        lastActivityAt: v.lastAt,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    const firstTimePartnersIn7d = new Set<string>();
    const allTimePartners = new Set(verifiedActions.map((a) => a.partnerId));
    for (const a of actionsIn7d) {
      const before7d = verifiedActions.some(
        (x) => x.partnerId === a.partnerId && x.createdAt < sevenDaysAgo
      );
      if (!before7d) firstTimePartnersIn7d.add(a.partnerId);
    }
    const newDiscoveries: PulsePartnerRow[] = Array.from(firstTimePartnersIn7d)
      .map((partnerId) => {
        const in24h = actionsIn24h.filter((x) => x.partnerId === partnerId);
        const score = in24h.length * 0.5;
        return {
          partnerId,
          partnerName: getPartnerName(partnerId),
          category: getPartnerCategory(partnerId),
          score,
          verifiedCount24h: in24h.length,
          lastActivityAt: in24h[in24h.length - 1]?.createdAt ?? now,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    const hour = new Date().getHours();
    const isTonight = hour >= 17;
    const tonightCategories = isTonight ? ['food', 'social', 'events'] : [];
    const tonightPicksPartners = isTonight
      ? trendingPartnersNow.filter((p) =>
          tonightCategories.some(
            (c) => p.category.toLowerCase().includes(c) || c === 'explore'
          )
        )
      : trendingPartnersNow.slice(0, 3);

    return {
      trendingPartnersNow,
      newDiscoveries,
      tonightPicksPartners,
    };
  }, [verifiedActions, now, oneHourAgo, twentyFourHoursAgo, sevenDaysAgo, getPartner]);

  const trendingDropsNow = useMemo(() => {
    return drops
      .filter((d) => d.qtyRemaining > 0 && now >= d.startAt && now <= d.endAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, TOP_N);
  }, [drops, now]);

  const liveTiles = useMemo((): PulseTile[] => {
    const tiles: PulseTile[] = [];
    for (const p of trendingPartnersNow.slice(0, 4)) {
      tiles.push({
        type: 'partner',
        id: `partner_${p.partnerId}`,
        title: p.partnerName,
        category: p.category,
        whyTrending: `${p.verifiedCount24h} verified • last 30m`,
        entityId: p.partnerId,
        primaryCta: 'redeem',
        score: p.score,
      });
    }
    const twoHoursMs = 2 * 60 * 60 * 1000;
    for (const d of trendingDropsNow.slice(0, 2)) {
      const minLeft = Math.max(0, Math.floor((d.endAt - now) / 60000));
      const finalHours = d.endAt - now < twoHoursMs;
      tiles.push({
        type: 'drop',
        id: `drop_${d.id}`,
        title: d.title,
        category: d.category,
        whyTrending: finalHours ? `Final hours • ${minLeft}m left` : `${d.qtyTotal - d.qtyRemaining} reserved • ${minLeft}m left`,
        entityId: d.id,
        qtyRemaining: d.qtyRemaining,
        endAt: d.endAt,
        finalHours,
        primaryCta: 'reserve_drop',
        score: d.qtyTotal - d.qtyRemaining,
        drop: d,
      });
    }
    return tiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [trendingPartnersNow, trendingDropsNow, now]);

  const tonightPicks = useMemo((): PulseTile[] => {
    const fromPartners: PulseTile[] = tonightPicksPartners.map((p) => ({
      type: 'partner',
      id: `tonight_${p.partnerId}`,
      title: p.partnerName,
      category: p.category,
      whyTrending: `${p.verifiedCount24h} verified • last 24h`,
      entityId: p.partnerId,
      primaryCta: 'redeem',
      score: p.score,
    }));
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const fromDrops: PulseTile[] = trendingDropsNow.slice(0, 3).map((d) => {
      const minLeft = Math.max(0, Math.floor((d.endAt - now) / 60000));
      const finalHours = d.endAt - now < TWO_HOURS_MS;
      return {
        type: 'drop' as const,
        id: `tonight_drop_${d.id}`,
        title: d.title,
        category: d.category,
        whyTrending: finalHours ? `Final hours • ${d.qtyRemaining} left • ${minLeft}m` : `${d.qtyRemaining} left • ${minLeft}m`,
        entityId: d.id,
        qtyRemaining: d.qtyRemaining,
        endAt: d.endAt,
        finalHours,
        primaryCta: 'reserve_drop' as const,
        score: d.qtyRemaining,
        drop: d,
      };
    });
    const getPartnerName = (partnerId: string) => getPartner(partnerId)?.name ?? partnerId;
    const getPartnerCategory = (partnerId: string) => getPartner(partnerId)?.category ?? 'explore';
    const fromMenuTonight: PulseTile[] = flags.partnerMenusTonightPicks
      ? documents
          .filter((d) => d.status === 'PUBLISHED')
          .flatMap((d) => {
            const ver = getCurrentVersion(d);
            if (!ver) return [];
            return ver.sections.flatMap((s) =>
              s.items.filter((i) => i.featuredTonight && i.available).map((i) => ({
                type: 'partner' as const,
                id: `tonight_menu_${d.partnerId}_${i.id}`,
                title: `${i.name} at ${getPartnerName(d.partnerId)}`,
                category: getPartnerCategory(d.partnerId),
                whyTrending: 'Tonight Pick',
                entityId: d.partnerId,
                primaryCta: 'navigate' as const,
                score: 1,
              }))
            );
          })
          .slice(0, 4)
      : [];
    return ([...fromMenuTonight, ...fromPartners, ...fromDrops].sort((a, b) => b.score - a.score).slice(0, 6) as PulseTile[]);
  }, [tonightPicksPartners, trendingDropsNow, now, documents, flags.partnerMenusTonightPicks, getCurrentVersion, getPartner]);

  return {
    liveTiles,
    trendingPartnersNow,
    trendingDropsNow,
    newDiscoveries,
    tonightPicks,
    loading: dropsLoading,
    refresh: refreshDrops,
  };
}
