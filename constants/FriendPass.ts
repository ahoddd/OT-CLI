/**
 * FriendPass — time-limited, proof-gated referral pass.
 * Creator earns after friend completes a verified win.
 */

export type FriendPassStatus = 'ACTIVE' | 'EXPIRED' | 'USED_UP';

export interface FriendPass {
  id: string;
  creatorUid: string;
  partnerId: string;
  dropId?: string;
  partnerName: string;
  createdAt: number;
  expiresAt: number;
  /** Max claims for this pass (admin-configurable, default 1). */
  limit: number;
  /** UIDs that have claimed this pass. */
  claimedBy: string[];
  rewardSpec: {
    friendBonusPoints: number;
    creatorBonusPoints: number;
  };
  status: FriendPassStatus;
}
