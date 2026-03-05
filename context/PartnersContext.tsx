import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  MOCK_PARTNERS,
  MOCK_PERKS,
  FEATURED_PERK_PARTNER_ID,
  SPONSORED_PERK_PARTNER_ID,
  ORBTAP_UNIVERSE_PARTNER_ID,
  ORBTAP_UNIVERSE_PARTNER,
  ORBTAP_UNIVERSE_PERKS,
  type Partner,
  type Perk,
} from '../constants/MockData';
import { isAdminEmail } from '../constants/Admin';
import { fetchPartnersFromFirestore, fetchPerksFromFirestore } from '../services/partnersFirestore';
import { useAuth } from './AuthContext';
import { useDemoDataEnabled } from '../hooks/useDemoDataEnabled';

/**
 * Merge partners: firestore first, then mock overwrites by id.
 * So when demo is on, mock data (e.g. p1 = platinum) wins and tiles auto-show correct tier.
 * When demo is off, only firestore is used; tier updates when backend/refetch updates it.
 */
function mergePartners(firestore: Partner[], mock: Partner[]): Partner[] {
  const byId = new Map<string, Partner>();
  firestore.forEach((p) => byId.set(p.id, p));
  mock.forEach((p) => byId.set(p.id, p));
  return Array.from(byId.values());
}

/**
 * Same as partners: firestore first, then mock overwrites so demo data is correct.
 */
function mergePerks(firestore: Perk[], mock: Perk[]): Perk[] {
  const byId = new Map<string, Perk>();
  firestore.forEach((p) => byId.set(p.id, p));
  mock.forEach((p) => byId.set(p.id, p));
  return Array.from(byId.values());
}

type PartnersContextValue = {
  partners: Partner[];
  perks: Perk[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getPartner: (id: string) => Partner | undefined;
  getPerk: (id: string) => Perk | undefined;
  getPerksForPartner: (partnerId: string) => Perk[];
  /** Active perks only (for user-facing discovery). */
  getActivePerksForPartner: (partnerId: string) => Perk[];
  getGridPartnersOrdered: () => Partner[];
  getFeaturedPartner: () => Partner | null;
};

const PartnersContext = createContext<PartnersContextValue | null>(null);

export function PartnersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { demoDataEnabled } = useDemoDataEnabled();
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [perks, setPerks] = useState<Perk[]>(MOCK_PERKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const mockP = demoDataEnabled ? MOCK_PARTNERS : [];
    const mockK = demoDataEnabled ? MOCK_PERKS : [];
    if (!user) {
      setPartners(mockP);
      setPerks(mockK);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [firestorePartners, firestorePerks] = await Promise.all([
        fetchPartnersFromFirestore(),
        fetchPerksFromFirestore(),
      ]);
      let merged = mergePartners(firestorePartners, mockP);
      if (user && isAdminEmail(user.email)) {
        const without = merged.filter((p) => p.id !== ORBTAP_UNIVERSE_PARTNER_ID);
        merged = [ORBTAP_UNIVERSE_PARTNER, ...without];
      }
      setPartners(merged);
      let mergedPerks = mergePerks(firestorePerks, mockK);
      if (user && isAdminEmail(user.email)) {
        const existingIds = new Set(mergedPerks.map((p) => p.id));
        const toAdd = ORBTAP_UNIVERSE_PERKS.filter((p) => !existingIds.has(p.id));
        if (toAdd.length) mergedPerks = [...toAdd, ...mergedPerks];
      }
      setPerks(mergedPerks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load partners');
      setPartners(mockP);
      setPerks(mockK);
    } finally {
      setLoading(false);
    }
  }, [user, demoDataEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  const getPartner = useCallback(
    (id: string) => partners.find((p) => p.id === id),
    [partners]
  );

  const getPerk = useCallback(
    (id: string) => perks.find((p) => p.id === id),
    [perks]
  );

  const getPerksForPartner = useCallback(
    (partnerId: string) => perks.filter((p) => p.partnerId === partnerId),
    [perks]
  );

  const getActivePerksForPartner = useCallback(
    (partnerId: string) => perks.filter((p) => p.partnerId === partnerId && p.active !== false),
    [perks]
  );

  const getGridPartnersOrdered = useCallback(() => {
    const featured = partners.find((p) => p.id === FEATURED_PERK_PARTNER_ID);
    const sponsored = partners.find((p) => p.id === SPONSORED_PERK_PARTNER_ID);
    const rest = partners.filter(
      (p) => p.id !== FEATURED_PERK_PARTNER_ID && p.id !== SPONSORED_PERK_PARTNER_ID
    );
    const ordered: Partner[] = [];
    if (featured) ordered.push(featured);
    if (sponsored) ordered.push(sponsored);
    ordered.push(...rest);
    return ordered;
  }, [partners]);

  const getFeaturedPartner = useCallback(() => {
    return partners.find((p) => p.id === FEATURED_PERK_PARTNER_ID) ?? null;
  }, [partners]);

  const value = useMemo<PartnersContextValue>(
    () => ({
      partners,
      perks,
      loading,
      error,
      refresh: load,
      getPartner,
      getPerk,
      getPerksForPartner,
      getActivePerksForPartner,
      getGridPartnersOrdered,
      getFeaturedPartner,
    }),
    [
      partners,
      perks,
      loading,
      error,
      load,
      getPartner,
      getPerk,
      getPerksForPartner,
      getActivePerksForPartner,
      getGridPartnersOrdered,
      getFeaturedPartner,
    ]
  );

  return <PartnersContext.Provider value={value}>{children}</PartnersContext.Provider>;
}

export function usePartners(): PartnersContextValue {
  const ctx = useContext(PartnersContext);
  if (!ctx) {
    throw new Error('usePartners must be used within PartnersProvider');
  }
  return ctx;
}
