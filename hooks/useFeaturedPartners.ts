/**
 * Featured partners for Orb hub: up to 3 paid slots from config + 1 wildcard, or demo partners when no config and demo data on.
 */

import { useEffect, useState, useMemo } from 'react';
import { getFeaturedPartnersConfig } from '../services/featuredPartners';
import type { FeaturedSlotConfig } from '../services/featuredPartners';
import { usePartners } from '../context/PartnersContext';
import { useDemoDataEnabled } from './useDemoDataEnabled';
import { MOCK_PARTNERS, ORBTAP_UNIVERSE_PARTNER_ID } from '../constants/MockData';
import type { Partner } from '../constants/MockData';

const WILDCARD_TIER = 'silver' as const;
/** First 3 demo partner IDs for featured carousel when Firestore config is empty (OrbTap Universe takes first slot). */
const DEMO_FEATURED_IDS = ['p1', 'p2', 'p3'];

export type FeaturedSlide = {
  partner: Partner;
  customImageUrl: string | null;
  badgeLabel: string;
  isWildcard: boolean;
};

export function useFeaturedPartners(): { slides: FeaturedSlide[]; loading: boolean; error: string | null } {
  const { getPartner, partners } = usePartners();
  const { demoDataEnabled } = useDemoDataEnabled();
  const [entries, setEntries] = useState<FeaturedSlotConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFeaturedPartnersConfig()
      .then((res) => {
        if (cancelled) return;
        if (res.success) setEntries(res.entries);
        else setError(res.message);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const slides = useMemo(() => {
    const out: FeaturedSlide[] = [];
    const orbtapUniverse = getPartner(ORBTAP_UNIVERSE_PARTNER_ID);
    const maxFromConfig = 3;

    if (entries.length > 0) {
      if (orbtapUniverse) {
        out.push({
          partner: orbtapUniverse,
          customImageUrl: null,
          badgeLabel: 'ORBTAP FEATURED',
          isWildcard: false,
        });
      }
      for (const e of entries.slice(0, orbtapUniverse ? maxFromConfig : undefined)) {
        if (e.partnerId === ORBTAP_UNIVERSE_PARTNER_ID) continue;
        const partner = getPartner(e.partnerId);
        if (partner) {
          out.push({
            partner,
            customImageUrl: e.customImageUrl,
            badgeLabel: 'ORBTAP FEATURED',
            isWildcard: false,
          });
        }
      }
      const freeTierPartners = partners.filter((p) => p.tier === WILDCARD_TIER && p.id !== ORBTAP_UNIVERSE_PARTNER_ID);
      if (freeTierPartners.length > 0) {
        const idx = Math.floor(Math.random() * freeTierPartners.length);
        out.push({
          partner: freeTierPartners[idx],
          customImageUrl: null,
          badgeLabel: 'WILDCARD',
          isWildcard: true,
        });
      }
    } else {
      if (orbtapUniverse) {
        out.push({
          partner: orbtapUniverse,
          customImageUrl: null,
          badgeLabel: 'ORBTAP FEATURED',
          isWildcard: false,
        });
      }
      if (demoDataEnabled) {
        const demoPartners = DEMO_FEATURED_IDS.map((id) => MOCK_PARTNERS.find((p) => p.id === id)).filter(
          (p): p is Partner => p != null
        );
        for (const partner of demoPartners) {
          out.push({
            partner,
            customImageUrl: null,
            badgeLabel: 'FEATURED',
            isWildcard: false,
          });
        }
      }
    }
    return out;
  }, [entries, getPartner, partners, demoDataEnabled]);

  return { slides, loading, error };
}
