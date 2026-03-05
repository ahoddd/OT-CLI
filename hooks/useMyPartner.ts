/**
 * Resolves the current user's linked partner (business) from users/{uid}.partnerId,
 * or from partners where ownerUid === user.uid, or OrbTap Universe for admin when testing as partner.
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { usePartners } from '../context/PartnersContext';
import { isAdminEmail } from '../constants/Admin';
import { ORBTAP_UNIVERSE_PARTNER_ID } from '../constants/MockData';
import type { Partner } from '../constants/MockData';

export interface UseMyPartnerResult {
  myPartnerId: string | null;
  myPartner: Partner | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useMyPartner(): UseMyPartnerResult {
  const { user } = useAuth();
  const { partners, getPartner, refresh: refreshPartners } = usePartners();
  const [myPartnerId, setMyPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setMyPartnerId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const pid = (snap.data()?.partnerId as string) || null;
      setMyPartnerId(pid && typeof pid === 'string' ? pid.trim() || null : null);
    } catch {
      setMyPartnerId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Fallback: if user doc has no partnerId, resolve by ownerUid or admin → OrbTap Universe
  useEffect(() => {
    if (loading || myPartnerId != null || !user?.uid) return;
    const owned = partners.find((p) => (p as Partner & { ownerUid?: string }).ownerUid === user.uid);
    if (owned) {
      setMyPartnerId(owned.id);
      return;
    }
    if (isAdminEmail(user?.email)) {
      const orbUniverse = getPartner(ORBTAP_UNIVERSE_PARTNER_ID);
      if (orbUniverse) setMyPartnerId(ORBTAP_UNIVERSE_PARTNER_ID);
    }
  }, [loading, myPartnerId, user?.uid, user?.email, partners, getPartner]);

  const myPartner = myPartnerId ? getPartner(myPartnerId) ?? null : null;

  const refresh = useCallback(async () => {
    await Promise.all([load(), refreshPartners()]);
  }, [load, refreshPartners]);

  return { myPartnerId, myPartner, loading, refresh };
}
