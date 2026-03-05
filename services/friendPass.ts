/**
 * FriendPass service — create, claim, and redeem proof-gated referral passes.
 * Anti-abuse: rate-limited, idempotent, requires verified win for reward.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FriendPass, FriendPassStatus } from '../constants/FriendPass';
import {
  FRIEND_PASS_EXPIRY_HOURS,
  FRIEND_PASS_MAX_PER_WEEK,
  FRIEND_PASS_MAX_CLAIMS,
  FRIEND_PASS_FRIEND_BONUS_POINTS,
  FRIEND_PASS_CREATOR_BONUS_POINTS,
} from '../constants/OrbSwipeConfig';

const STORAGE_KEY = 'ORBTAP_FRIEND_PASSES_V1';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function loadAll(): Promise<FriendPass[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(passes: FriendPass[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(passes.slice(0, 200)));
  } catch {}
}

function refreshStatus(pass: FriendPass): FriendPass {
  if (pass.status === 'ACTIVE' && Date.now() > pass.expiresAt) {
    pass.status = 'EXPIRED';
  }
  if (pass.status === 'ACTIVE' && pass.claimedBy.length >= pass.limit) {
    pass.status = 'USED_UP';
  }
  return pass;
}

export async function createFriendPass(params: {
  creatorUid: string;
  partnerId: string;
  partnerName: string;
  dropId?: string;
}): Promise<{ pass: FriendPass | null; error?: string }> {
  const all = await loadAll();
  const now = Date.now();
  const weekAgo = now - WEEK_MS;

  const recentByCreator = all.filter(
    (p) => p.creatorUid === params.creatorUid && p.createdAt > weekAgo
  );
  if (recentByCreator.length >= FRIEND_PASS_MAX_PER_WEEK) {
    return { pass: null, error: `Max ${FRIEND_PASS_MAX_PER_WEEK} passes per week` };
  }

  const pass: FriendPass = {
    id: `fp_${now}_${Math.random().toString(36).slice(2, 8)}`,
    creatorUid: params.creatorUid,
    partnerId: params.partnerId,
    partnerName: params.partnerName,
    dropId: params.dropId,
    createdAt: now,
    expiresAt: now + FRIEND_PASS_EXPIRY_HOURS * 60 * 60 * 1000,
    limit: FRIEND_PASS_MAX_CLAIMS,
    claimedBy: [],
    rewardSpec: {
      friendBonusPoints: FRIEND_PASS_FRIEND_BONUS_POINTS,
      creatorBonusPoints: FRIEND_PASS_CREATOR_BONUS_POINTS,
    },
    status: 'ACTIVE',
  };

  all.unshift(pass);
  await saveAll(all);
  return { pass };
}

export async function claimFriendPass(passId: string, friendUid: string): Promise<{
  success: boolean;
  error?: string;
  pass?: FriendPass;
}> {
  const all = await loadAll();
  const pass = all.find((p) => p.id === passId);
  if (!pass) return { success: false, error: 'Pass not found' };
  refreshStatus(pass);

  if (pass.status !== 'ACTIVE') return { success: false, error: `Pass is ${pass.status.toLowerCase()}` };
  if (pass.creatorUid === friendUid) return { success: false, error: 'Cannot claim your own pass' };
  if (pass.claimedBy.includes(friendUid)) return { success: false, error: 'Already claimed' };
  if (pass.claimedBy.length >= pass.limit) {
    pass.status = 'USED_UP';
    await saveAll(all);
    return { success: false, error: 'Pass fully claimed' };
  }

  pass.claimedBy.push(friendUid);
  if (pass.claimedBy.length >= pass.limit) pass.status = 'USED_UP';
  await saveAll(all);
  return { success: true, pass };
}

export async function getMyFriendPasses(creatorUid: string): Promise<FriendPass[]> {
  const all = await loadAll();
  return all.filter((p) => p.creatorUid === creatorUid).map(refreshStatus);
}

export async function getFriendPassById(passId: string): Promise<FriendPass | null> {
  const all = await loadAll();
  const pass = all.find((p) => p.id === passId);
  return pass ? refreshStatus(pass) : null;
}

/**
 * After friend completes a verified win, check if there's a pending FriendPass claim
 * and return bonus specs for both friend and creator.
 */
export async function checkFriendPassReward(friendUid: string, partnerId: string): Promise<{
  friendBonus: number;
  creatorBonus: number;
  creatorUid: string;
  passId: string;
} | null> {
  const all = await loadAll();
  const pass = all.find(
    (p) =>
      p.claimedBy.includes(friendUid) &&
      p.partnerId === partnerId
  );
  if (!pass) return null;
  return {
    friendBonus: pass.rewardSpec.friendBonusPoints,
    creatorBonus: pass.rewardSpec.creatorBonusPoints,
    creatorUid: pass.creatorUid,
    passId: pass.id,
  };
}
