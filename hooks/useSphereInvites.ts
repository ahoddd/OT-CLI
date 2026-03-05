/**
 * Partner → Sphere invites. Load/save from AsyncStorage; accept/deny with OT.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadSphereInvites,
  saveSphereInvites,
  generateSphereInviteId,
  type SphereInvite,
  type SphereInviteDuration,
} from '../constants/SphereInvites';
import { useWallet } from './useWallet';
import { LEDGER_REASON } from '../constants/OrbinomicsPolicy';

export function useSphereInvites() {
  const [invites, setInvites] = useState<SphereInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const { balance, addTransaction } = useWallet();

  useEffect(() => {
    loadSphereInvites().then((list) => {
      setInvites(list);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: SphereInvite[]) => {
    setInvites(next);
    await saveSphereInvites(next);
  }, []);

  const getByInviteCode = useCallback(
    (inviteCode: string) => {
      const normalized = inviteCode.replace(/\s/g, '').replace(/-/g, '').toUpperCase();
      return invites.filter(
        (i) => i.sphereInviteCode.replace(/-/g, '').toUpperCase() === normalized
      );
    },
    [invites]
  );

  const getPendingByInviteCode = useCallback(
    (inviteCode: string) =>
      getByInviteCode(inviteCode).filter((i) => i.status === 'pending'),
    [getByInviteCode]
  );

  /** Find an accepted, staked invite for this partner (by id or name) — for clearing stake when user scans at partner. */
  const getStakedInviteForPartner = useCallback(
    (partnerIdOrName: string) =>
      invites.find(
        (i) =>
          (i.partnerId === partnerIdOrName || i.partnerName === partnerIdOrName) &&
          i.acceptedBy === 'You' &&
          (i.stakedAmount ?? 0) > 0 &&
          !i.clearedAt
      ),
    [invites]
  );

  const addInvite = useCallback(
    async (invite: Omit<SphereInvite, 'id' | 'createdAt' | 'status' | 'expiresAt'> & { duration?: SphereInviteDuration }): Promise<SphereInvite> => {
      const code = invite.sphereInviteCode.trim().replace(/\s/g, '').toUpperCase();
      if (!code) throw new Error('Sphere invite code is required.');
      const now = Date.now();
      const duration = invite.duration ?? 'day';
      const expiresAt =
        duration === 'day' ? now + 24 * 60 * 60 * 1000
        : duration === 'week' ? now + 7 * 24 * 60 * 60 * 1000
        : now + 30 * 24 * 60 * 60 * 1000;
      const newInvite: SphereInvite = {
        ...invite,
        sphereInviteCode: code,
        id: generateSphereInviteId(),
        createdAt: now,
        status: 'pending',
        duration,
        expiresAt,
      };
      await persist([...invites, newInvite]);
      return newInvite;
    },
    [invites, persist]
  );

  const acceptInvite = useCallback(
    async (
      inviteId: string,
      memberName: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const inv = invites.find((i) => i.id === inviteId);
      if (!inv) return { ok: false, error: 'Invite not found.' };
      if (inv.status !== 'pending') return { ok: false, error: 'Invite is no longer pending.' };
      if (inv.otCost > 0 && balance < inv.otCost)
        return { ok: false, error: `You need ${inv.otCost} OT Points. Your balance: ${balance}.` };

      if (inv.otCost > 0) {
        await addTransaction({
          type: 'spend',
          amount: inv.otCost,
          reason: LEDGER_REASON.BURN_CIRCLE_BONUS_POOL,
          ref: { sphereInviteId: inviteId, partnerId: inv.partnerId },
        });
      }

      const next = invites.map((i) =>
        i.id === inviteId
          ? {
              ...i,
              status: 'accepted' as const,
              acceptedBy: memberName,
              acceptedAt: Date.now(),
              stakedAmount: inv.otCost > 0 ? inv.otCost : undefined,
            }
          : i
      );
      await persist(next);
      return { ok: true };
    },
    [invites, balance, addTransaction, persist]
  );

  const denyInvite = useCallback(
    async (inviteId: string): Promise<void> => {
      const next = invites.map((i) =>
        i.id === inviteId ? { ...i, status: 'denied' as const } : i
      );
      await persist(next);
    },
    [invites, persist]
  );

  const clearStake = useCallback(
    async (inviteId: string): Promise<void> => {
      const next = invites.map((i) =>
        i.id === inviteId ? { ...i, clearedAt: Date.now() } : i
      );
      await persist(next);
    },
    [invites, persist]
  );

  return {
    invites,
    loading,
    getByInviteCode,
    getPendingByInviteCode,
    getStakedInviteForPartner,
    addInvite,
    acceptInvite,
    denyInvite,
    clearStake,
  };
}
