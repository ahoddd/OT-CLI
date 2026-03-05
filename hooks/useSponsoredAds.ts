/**
 * useSponsoredAds — fetch ads and config for a placement (orb_carousel, daily_ritual_reward).
 * useSponsoredAdsConfig — fetch config only (admin).
 */

import { useState, useEffect, useCallback } from 'react';
import * as sponsoredAdsService from '../services/sponsoredAds';
import type { SponsoredAdDoc, SponsoredAdsConfig, SponsoredAdPlacement } from '../constants/sponsoredAds';

export function useSponsoredAds(placement: SponsoredAdPlacement) {
  const [ads, setAds] = useState<SponsoredAdDoc[]>([]);
  const [config, setConfig] = useState<SponsoredAdsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [configRes, adsRes] = await Promise.all([
      sponsoredAdsService.getSponsoredAdsConfig(),
      sponsoredAdsService.listSponsoredAds(placement),
    ]);
    if (configRes.success) setConfig(configRes.config);
    else setError(configRes.message);
    if (adsRes.success) setAds(adsRes.ads);
    else if (!configRes.success) setError(adsRes.message);
    setLoading(false);
  }, [placement]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ads, config, loading, error, refetch };
}

export function useSponsoredAdsConfig() {
  const [config, setConfig] = useState<SponsoredAdsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await sponsoredAdsService.getSponsoredAdsConfig();
    if (res.success) setConfig(res.config);
    else setError(res.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { config, loading, error, refetch };
}
