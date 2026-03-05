/**
 * OrbSwipe deck composition — drops + missions, filters from prefs, sponsored insertion.
 */

import { useMemo } from 'react';
import type { Drop } from '../constants/Drops';
import { ORBSWIPE_PLACEHOLDER_IMAGES } from '../constants/Drops';
import type { DailyMission } from '../context/MissionsContext';
import type { OrbSwipeCard, OrbSwipeSponsoredCard } from '../constants/OrbSwipeDeck';
import { ORBSWIPE_SPONSORED_CONFIG, ORBSWIPE_DECK_SESSION_CAP, ORBSWIPE_WHY_LABELS } from '../constants/OrbSwipeDeck';
import type { OrbSwipePreferences } from './useOrbSwipePreferences';
import { isMissionFullyComplete } from '../context/MissionsContext';
import { usePartners } from '../context/PartnersContext';
import type { Partner } from '../constants/MockData';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function dropToCard(drop: Drop, whyLabel: string): OrbSwipeCard {
  const now = Date.now();
  const remaining = Math.max(0, drop.endAt - now);
  const scarcity =
    drop.qtyRemaining <= 3
      ? `${drop.qtyRemaining} left · ${remaining < 60 * 60 * 1000 ? 'Ends soon' : 'Live'}`
      : remaining < 60 * 60 * 1000
        ? 'Ends in <1h'
        : undefined;
  return {
    id: `drop_${drop.id}`,
    type: 'DROP_CARD',
    dropId: drop.id,
    drop,
    partnerId: drop.partnerId,
    partnerName: drop.partnerName,
    verified: drop.tier === 'gold' || drop.tier === 'platinum',
    tier: drop.tier,
    distanceLabel: 'Near you',
    whyLabel,
    valueSummary: drop.title,
    ctaHint: 'Reserve',
    scarcity,
    imageUrl: drop.imageUrl ?? ORBSWIPE_PLACEHOLDER_IMAGES[drop.category],
    description: drop.description,
    reserveCostOt: drop.reserveFeePoints,
    earnOtLabel: 'Earn OT on redeem',
  };
}

function missionToCard(mission: DailyMission, partnerName: string, whyLabel: string): OrbSwipeCard {
  return {
    id: `mission_${mission.id}`,
    type: 'MISSION_CARD',
    missionId: mission.id,
    mission,
    partnerId: mission.partnerId ?? mission.steps?.[0]?.partnerId ?? '',
    partnerName,
    verified: false,
    tier: 'silver',
    distanceLabel: 'Near you',
    whyLabel,
    valueSummary: mission.title,
    ctaHint: 'Do',
    imageUrl: ORBSWIPE_PLACEHOLDER_IMAGES.explore,
    description: mission.description,
    earnOtLabel: `Earn ${mission.rewardPoints} OT`,
  };
}

const PARTNER_CATEGORY_IMAGES: Record<string, string> = {
  dining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
};

function partnerToCard(partner: Partner): OrbSwipeCard {
  const imageUrl = partner.featuredImageUrl ?? partner.logoUrl ?? PARTNER_CATEGORY_IMAGES[partner.category] ?? ORBSWIPE_PLACEHOLDER_IMAGES.explore;
  return {
    id: `partner_${partner.id}`,
    type: 'PARTNER_CARD',
    partnerId: partner.id,
    partnerName: partner.name,
    verified: partner.verified,
    tier: partner.tier,
    distanceLabel: 'Near you',
    whyLabel: partner.verified ? ORBSWIPE_WHY_LABELS.open_now : ORBSWIPE_WHY_LABELS.nearby,
    valueSummary: partner.description?.slice(0, 80) ?? partner.name,
    ctaHint: 'Visit',
    imageUrl,
    description: partner.hours ? `Open ${partner.hours}` : undefined,
    earnOtLabel: 'Visit to earn OT',
  };
}

function toSponsoredCard(card: OrbSwipeCard): OrbSwipeSponsoredCard {
  if (card.type === 'SPONSORED_CARD') return card as OrbSwipeSponsoredCard;
  return {
    ...card,
    type: 'SPONSORED_CARD',
    id: `sp_${card.id}`,
    whyLabel: ORBSWIPE_WHY_LABELS.sponsored,
  } as OrbSwipeSponsoredCard;
}

export function useOrbSwipeDeck(
  drops: Drop[],
  todayMissions: DailyMission[],
  prefs: OrbSwipePreferences,
  options: {
    maxCards?: number;
    sponsoredEnabled?: boolean;
    sponsoredCountThisSession?: number;
  } = {}
): { cards: OrbSwipeCard[] } {
  const { getPartner, partners: allPartners } = usePartners();
  const { maxCards = ORBSWIPE_DECK_SESSION_CAP, sponsoredEnabled = true, sponsoredCountThisSession = 0 } = options;

  return useMemo(() => {
    const now = Date.now();
    const windowEnd = now + SIX_HOURS_MS;

    const liveDrops = drops.filter(
      (d) =>
        d.qtyRemaining > 0 &&
        d.endAt > now &&
        d.startAt <= windowEnd &&
        !prefs.hiddenPartnerIds.includes(d.partnerId) &&
        !prefs.hideCategoryIds.includes(d.category)
    );

    const incompleteMissions = todayMissions.filter(
      (m) =>
        !isMissionFullyComplete(m) &&
        m.deadlineAt > now &&
        !(m.partnerId && prefs.hiddenPartnerIds.includes(m.partnerId))
    );

    const organic: OrbSwipeCard[] = [];
    liveDrops.forEach((d) => organic.push(dropToCard(d, d.qtyRemaining <= 5 ? ORBSWIPE_WHY_LABELS.limited : ORBSWIPE_WHY_LABELS.nearby)));
    incompleteMissions.forEach((m) => {
      const partnerId = m.partnerId ?? m.steps?.[0]?.partnerId;
      const partner = partnerId ? getPartner(partnerId) : undefined;
      organic.push(missionToCard(m, partner?.name ?? 'Partner', ORBSWIPE_WHY_LABELS.trending));
    });

    // Fill deck with partner discovery cards for partners not already represented
    const representedPartnerIds = new Set(organic.map((c) => c.partnerId));
    const discoveryPartners = allPartners.filter(
      (p) => !representedPartnerIds.has(p.id) && !prefs.hiddenPartnerIds.includes(p.id)
    );
    // Prioritize verified/higher-tier partners
    discoveryPartners.sort((a, b) => {
      const tierWeight = { platinum: 3, gold: 2, silver: 1 };
      const wa = tierWeight[a.tier] + (a.verified ? 2 : 0);
      const wb = tierWeight[b.tier] + (b.verified ? 2 : 0);
      return wb - wa;
    });
    discoveryPartners.forEach((p) => organic.push(partnerToCard(p)));

    if (organic.length === 0) {
      return { cards: [] };
    }

    // Priority sort: scarce/ending-soon drops first, then other drops, then missions by reward, then partners
    const priorityScore = (c: OrbSwipeCard): number => {
      if (c.type === 'DROP_CARD' && 'drop' in c) {
        const d = c.drop;
        const minsLeft = Math.max(0, (d.endAt - now) / 60000);
        const scarce = d.qtyRemaining <= 5 ? 4000 : 3000;
        return scarce - minsLeft / 1000; // sooner end = higher
      }
      if (c.type === 'MISSION_CARD' && 'mission' in c) return 2000 + (c.mission.rewardPoints ?? 0);
      return 1000; // PARTNER_CARD / SPONSORED / MEAL_PROPOSAL
    };
    const sorted = [...organic].sort((a, b) => priorityScore(b) - priorityScore(a));
    const capped = sorted.slice(0, maxCards);

    if (!sponsoredEnabled || sponsoredCountThisSession >= ORBSWIPE_SPONSORED_CONFIG.maxSponsoredPerSession) {
      return { cards: capped };
    }

    const verifiedDrops = liveDrops.filter((d) => d.tier === 'gold' || d.tier === 'platinum');
    if (verifiedDrops.length === 0) return { cards: capped };

    const maxSponsoredToAdd = Math.min(
      ORBSWIPE_SPONSORED_CONFIG.maxSponsoredPerSession - sponsoredCountThisSession,
      3
    );
    const insertPositions = [
      ORBSWIPE_SPONSORED_CONFIG.swipesBetweenSponsored,
      ORBSWIPE_SPONSORED_CONFIG.swipesBetweenSponsored + 6,
      ORBSWIPE_SPONSORED_CONFIG.swipesBetweenSponsored + 12,
    ].filter((p) => p < maxCards).slice(0, maxSponsoredToAdd);

    const out: OrbSwipeCard[] = [];
    let organicIdx = 0;
    let nextSponsoredPosIdx = 0;
    for (let i = 0; i < capped.length + insertPositions.length; i++) {
      if (nextSponsoredPosIdx < insertPositions.length && insertPositions[nextSponsoredPosIdx] === i) {
        const pick = verifiedDrops[Math.floor(Math.random() * verifiedDrops.length)];
        out.push(toSponsoredCard(dropToCard(pick, ORBSWIPE_WHY_LABELS.sponsored)));
        nextSponsoredPosIdx++;
      } else if (organicIdx < capped.length) {
        out.push(capped[organicIdx++]);
      }
    }
    while (organicIdx < capped.length) {
      out.push(capped[organicIdx++]);
    }

    const final = out.slice(0, maxCards);
    return { cards: final.map((card, idx) => ({ ...card, id: `${card.id}_${idx}` })) };
  }, [drops, todayMissions, prefs.hiddenPartnerIds, prefs.hideCategoryIds, getPartner, allPartners, maxCards, sponsoredEnabled, sponsoredCountThisSession]);
}
