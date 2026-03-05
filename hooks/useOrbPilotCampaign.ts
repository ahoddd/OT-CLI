/**
 * OrbPilot™ — Partner hook: campaign management and metrics.
 */

import { useState, useCallback } from 'react';
import * as pilotApi from '../services/orbPilot';
import type { CampaignDoc, OrbPilotMetrics } from '../constants/OrbPilot';

export function useOrbPilotCampaign(partnerId?: string) {
  const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignDoc | null>(null);
  const [metrics, setMetrics] = useState<OrbPilotMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await pilotApi.pilotPartnerListCampaigns(partnerId);
    if (res.success) {
      setCampaigns(res.campaigns);
      if (res.campaigns.length > 0) setCurrentCampaign(res.campaigns[0] ?? null);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, [partnerId]);

  const create = useCallback(async (params: Parameters<typeof pilotApi.pilotCampaignCreate>[0]) => {
    setLoading(true);
    const res = await pilotApi.pilotCampaignCreate(params);
    if (res.success) {
      await loadCampaigns();
    }
    setLoading(false);
    return res;
  }, [loadCampaigns]);

  const update = useCallback(async (campaignId: string, fields: Partial<CampaignDoc>) => {
    const res = await pilotApi.pilotCampaignUpdate(campaignId, fields);
    if (res.success) await loadCampaigns();
    return res;
  }, [loadCampaigns]);

  const activate = useCallback(async (campaignId: string) => {
    const res = await pilotApi.pilotCampaignActivate(campaignId);
    if (res.success) await loadCampaigns();
    return res;
  }, [loadCampaigns]);

  const pause = useCallback(async (campaignId: string) => {
    const res = await pilotApi.pilotCampaignPause(campaignId);
    if (res.success) await loadCampaigns();
    return res;
  }, [loadCampaigns]);

  const resume = useCallback(async (campaignId: string) => {
    const res = await pilotApi.pilotCampaignResume(campaignId);
    if (res.success) await loadCampaigns();
    return res;
  }, [loadCampaigns]);

  const end = useCallback(async (campaignId: string) => {
    const res = await pilotApi.pilotCampaignEnd(campaignId);
    if (res.success) await loadCampaigns();
    return res;
  }, [loadCampaigns]);

  const loadMetrics = useCallback(async (pid?: string, from?: string, to?: string) => {
    const res = await pilotApi.pilotMetricsPartner(pid ?? partnerId ?? '', from, to);
    if (res.success) setMetrics(res.metrics);
    return res;
  }, [partnerId]);

  const loadCampaignMetrics = useCallback(async (campaignId: string, from?: string, to?: string) => {
    const res = await pilotApi.pilotMetricsCampaign(campaignId, from, to);
    if (res.success) setMetrics(res.metrics);
    return res;
  }, []);

  return {
    campaigns,
    currentCampaign,
    metrics,
    loading,
    error,
    loadCampaigns,
    create,
    update,
    activate,
    pause,
    resume,
    end,
    loadMetrics,
    loadCampaignMetrics,
    setCurrentCampaign,
  };
}
