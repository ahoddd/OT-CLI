/**
 * OrbPilot™ — Admin hook: kill switches, audit, trust, risk, engine.
 */

import { useState, useCallback } from 'react';
import * as pilotApi from '../services/orbPilot';
import type { TrustTier, CampaignDoc } from '../constants/OrbPilot';

export function useOrbPilotAdmin() {
  const [audit, setAudit] = useState<unknown[]>([]);
  const [trustUsers, setTrustUsers] = useState<unknown[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [lastRun, setLastRun] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const killSwitch = useCallback(async (scope: 'global' | 'city' | 'partner' | 'campaign', targetId: string, kill: boolean) => {
    return pilotApi.pilotAdminKillSwitch(scope, targetId, kill);
  }, []);

  const fetchAudit = useCallback(async (query: { partnerId?: string; userId?: string; campaignId?: string; limit?: number }) => {
    setLoading(true);
    setError(null);
    const res = await pilotApi.pilotAdminAudit(query);
    if (res.success) setAudit(res.attempts);
    else setError(res.message);
    setLoading(false);
    return res;
  }, []);

  const overrideTrust = useCallback(async (userId: string, tier: TrustTier, reason: string) => {
    return pilotApi.pilotAdminUserTrust(userId, tier, reason);
  }, []);

  const setPartnerRisk = useCallback(async (partnerId: string, riskProfile: 'low' | 'medium' | 'high', forcePinRequired: boolean) => {
    return pilotApi.pilotAdminPartnerRisk(partnerId, riskProfile, forcePinRequired);
  }, []);

  const fetchTrust = useCallback(async (tier?: TrustTier) => {
    setLoading(true);
    const res = await pilotApi.pilotAdminListTrust(tier);
    if (res.success) setTrustUsers(res.users);
    setLoading(false);
    return res;
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const res = await pilotApi.pilotAdminListCampaigns();
    if (res.success) setCampaigns(res.campaigns);
    setLoading(false);
    return res;
  }, []);

  const fetchConfig = useCallback(async () => {
    const res = await pilotApi.pilotAdminGetConfig();
    if (res.success) setConfig(res.config);
    return res;
  }, []);

  const updateConfig = useCallback(async (updates: Record<string, unknown>) => {
    const res = await pilotApi.pilotAdminUpdateConfig(updates);
    if (res.success) await fetchConfig();
    return res;
  }, [fetchConfig]);

  const fetchTick = useCallback(async () => {
    const res = await pilotApi.pilotAdminEngineLastRun();
    if (res.success) setLastRun(res.run);
    return res;
  }, []);

  const runTick = useCallback(async () => {
    return pilotApi.pilotEngineTick();
  }, []);

  return {
    audit,
    trustUsers,
    campaigns,
    config,
    lastRun,
    loading,
    error,
    killSwitch,
    fetchAudit,
    overrideTrust,
    setPartnerRisk,
    fetchTrust,
    fetchCampaigns,
    fetchConfig,
    updateConfig,
    fetchTick,
    runTick,
  };
}
