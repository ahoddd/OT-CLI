/**
 * OrbPilot™ — User hook: nearby offers, claim, cancel.
 * Polls every 60s when screen is focused (slot expiry awareness).
 */

import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import * as pilotApi from '../services/orbPilot';
import type { OrbPilotOffer } from '../constants/OrbPilot';

export function useOrbPilotOffers() {
  const [offers, setOffers] = useState<OrbPilotOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNearby = useCallback(async (lat: number, lng: number, radiusM?: number) => {
    setLoading(true);
    setError(null);
    const res = await pilotApi.pilotOfferNearby(lat, lng, radiusM);
    if (res.success) {
      setOffers(res.offers);
    } else {
      setError(res.message ?? 'Failed to load nearby offers');
    }
    setLoading(false);
  }, []);

  const claim = useCallback(async (slotId: string, lat: number, lng: number) => {
    setClaiming(true);
    const res = await pilotApi.pilotOfferClaim(slotId, lat, lng);
    setClaiming(false);
    if (res.success) {
      // Remove claimed offer from list
      setOffers((prev) => prev.filter((o) => o.slotId !== slotId));
    }
    return res;
  }, []);

  const cancel = useCallback(async (slotId: string) => {
    return pilotApi.pilotOfferCancel(slotId);
  }, []);

  // Poll every 60s when focused
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [])
  );

  return {
    offers,
    loading,
    error,
    claiming,
    loadNearby,
    claim,
    cancel,
    setOffers,
  };
}
