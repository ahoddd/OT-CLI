/**
 * OrbDrop™ — limited-qty, time-windowed drops + reservations.
 * Blueprint: scarcity + reservation; redeem triggers OrbProof receipt.
 */

import type { Tier } from './MockData';

export type DropCategory = 'coffee' | 'food' | 'fitness' | 'events' | 'explore' | 'social';

export interface Drop {
  id: string;
  partnerId: string;
  partnerName: string;
  /** Optional link to a perk for redemption rules. */
  perkId?: string;
  title: string;
  description: string;
  category: DropCategory;
  tier: Tier;
  /** Window start (ms). */
  startAt: number;
  /** Window end (ms). */
  endAt: number;
  qtyTotal: number;
  qtyRemaining: number;
  /** Reserve fee in OT Points (0 = free). Anti-spam, commitment device. */
  reserveFeePoints: number;
  /** Optional OrbPass level required for early access. */
  orbPassLevelRequired?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Reservation {
  id: string;
  dropId: string;
  /** Local MVP: "You" or uid when wired to auth. */
  userId: string;
  status: 'reserved' | 'redeemed' | 'expired' | 'cancelled';
  expiresAt: number;
  reserveFeePaid: number;
  createdAt: number;
}

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Mock live drops for MVP. Replace with Firestore/API when backend is ready. */
export const MOCK_DROPS: Drop[] = [
  {
    id: 'drop_1',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    perkId: 'pk1',
    title: 'Free Taco Drop',
    description: 'One free taco with drink. Limited 20 today.',
    category: 'food',
    tier: 'common',
    startAt: NOW - HOUR,
    endAt: NOW + 6 * HOUR,
    qtyTotal: 20,
    qtyRemaining: 12,
    reserveFeePoints: 0,
    createdAt: NOW - 2 * HOUR,
    updatedAt: NOW,
  },
  {
    id: 'drop_2',
    partnerId: 'p3',
    partnerName: 'Pub 447',
    perkId: 'pk6',
    title: 'BOGO Draft Tonight',
    description: 'Buy one get one draft. Tonight only, 15 slots.',
    category: 'social',
    tier: 'apex',
    startAt: NOW,
    endAt: NOW + 5 * HOUR,
    qtyTotal: 15,
    qtyRemaining: 8,
    reserveFeePoints: 10,
    createdAt: NOW - HOUR,
    updatedAt: NOW,
  },
  {
    id: 'drop_3',
    partnerId: 'p12',
    partnerName: 'Mountain Mug Coffee',
    title: 'Morning Brew Drop',
    description: 'Free refill + pastry. First 10 get it.',
    category: 'coffee',
    tier: 'common',
    startAt: NOW + 2 * HOUR,
    endAt: NOW + 4 * HOUR,
    qtyTotal: 10,
    qtyRemaining: 10,
    reserveFeePoints: 5,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const DROPS_STORAGE_KEY = 'ORBTAP_DROPS_V1';
export const RESERVATIONS_STORAGE_KEY = 'ORBTAP_RESERVATIONS_V1';
