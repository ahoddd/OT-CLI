/**
 * OrbDrop™ — list drops, reserve, redeem.
 * Redeem triggers OrbProof (createVerifiedAction + receipt).
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Drop,
  type Reservation,
  MOCK_DROPS,
  RESERVATIONS_STORAGE_KEY,
} from '../constants/Drops';

const USER_ID = 'You'; // MVP: local; replace with auth uid when wired.

export interface UseDropsResult {
  drops: Drop[];
  reservations: Reservation[];
  loading: boolean;
  reserve: (dropId: string, reserveFeePaid: number) => Promise<Reservation | null>;
  redeem: (reservationId: string) => Promise<{ success: boolean; drop?: Drop; error?: string }>;
  getReservationForDrop: (dropId: string) => Reservation | null;
  refresh: () => Promise<void>;
}

export function useDrops(): UseDropsResult {
  const [drops, setDrops] = useState<Drop[]>(MOCK_DROPS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RESERVATIONS_STORAGE_KEY);
      const list: Reservation[] = raw ? JSON.parse(raw) : [];
      setReservations(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('useDrops load reservations:', e);
      setReservations([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadReservations();
      setLoading(false);
    })();
  }, [loadReservations]);

  const persistReservations = useCallback(async (list: Reservation[]) => {
    try {
      await AsyncStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('useDrops persist reservations:', e);
    }
  }, []);

  const reserve = useCallback(
    async (dropId: string, reserveFeePaid: number): Promise<Reservation | null> => {
      const drop = drops.find((d) => d.id === dropId);
      if (!drop || drop.qtyRemaining <= 0) return null;
      const now = Date.now();
      if (now > drop.endAt) return null;
      const reservation: Reservation = {
        id: `res_${now}`,
        dropId,
        userId: USER_ID,
        status: 'reserved',
        expiresAt: Math.min(now + 30 * 60 * 1000, drop.endAt), // 30 min or drop end
        reserveFeePaid,
        createdAt: now,
      };
      const next = [reservation, ...reservations];
      setReservations(next);
      await persistReservations(next);
      if (drop.qtyRemaining > 0) {
        setDrops((prev) =>
          prev.map((d) =>
            d.id === dropId ? { ...d, qtyRemaining: d.qtyRemaining - 1, updatedAt: now } : d
          )
        );
      }
      return reservation;
    },
    [drops, reservations, persistReservations]
  );

  const redeem = useCallback(
    async (
      reservationId: string
    ): Promise<{ success: boolean; drop?: Drop; error?: string }> => {
      const res = reservations.find((r) => r.id === reservationId);
      if (!res || res.status !== 'reserved') {
        return { success: false, error: 'Invalid or already used reservation' };
      }
      const now = Date.now();
      if (now > res.expiresAt) {
        const next = reservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'expired' as const } : r
        );
        setReservations(next);
        await persistReservations(next);
        return { success: false, error: 'Reservation expired' };
      }
      const drop = drops.find((d) => d.id === res.dropId);
      if (!drop) return { success: false, error: 'Drop not found' };
      const next = reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'redeemed' as const } : r
      );
      setReservations(next);
      await persistReservations(next);
      return { success: true, drop };
    },
    [drops, reservations, persistReservations]
  );

  const getReservationForDrop = useCallback(
    (dropId: string): Reservation | null => {
      return (
        reservations.find(
          (r) => r.dropId === dropId && (r.status === 'reserved' || r.status === 'redeemed')
        ) ?? null
      );
    },
    [reservations]
  );

  const refresh = useCallback(async () => {
    await loadReservations();
  }, [loadReservations]);

  return {
    drops,
    reservations,
    loading,
    reserve,
    redeem,
    getReservationForDrop,
    refresh,
  };
}
