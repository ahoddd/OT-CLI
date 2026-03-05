/**
 * OrbDrop™ — limited-qty, time-windowed drops + reservations.
 * Blueprint: scarcity + reservation; redeem triggers OrbProof receipt.
 */

import type { PartnerTier } from './PartnerTiers';

export type DropCategory = 'coffee' | 'food' | 'fitness' | 'events' | 'explore' | 'social';

/** Placeholder image URLs for OrbSwipe cards (food, coffee, social, etc.). */
export const ORBSWIPE_PLACEHOLDER_IMAGES: Record<DropCategory, string> = {
  food: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  events: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  explore: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
  social: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
};

export interface Drop {
  id: string;
  partnerId: string;
  partnerName: string;
  /** Optional link to a perk for redemption rules. */
  perkId?: string;
  title: string;
  description: string;
  category: DropCategory;
  tier: PartnerTier;
  /** Optional hero image URL for OrbSwipe cards. Falls back to category placeholder. */
  imageUrl?: string;
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
    tier: 'silver',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
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
    tier: 'platinum',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
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
    tier: 'silver',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    startAt: NOW + 2 * HOUR,
    endAt: NOW + 4 * HOUR,
    qtyTotal: 10,
    qtyRemaining: 10,
    reserveFeePoints: 5,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'drop_4',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    title: 'Happy Hour Tacos',
    description: '2 tacos + house margarita. 5–7 PM only.',
    category: 'food',
    tier: 'gold',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    startAt: NOW,
    endAt: NOW + 4 * HOUR,
    qtyTotal: 30,
    qtyRemaining: 18,
    reserveFeePoints: 5,
    createdAt: NOW - HOUR,
    updatedAt: NOW,
  },
  {
    id: 'drop_5',
    partnerId: 'p3',
    partnerName: 'Pub 447',
    title: 'Weekend Brunch Drop',
    description: 'Brunch for two + coffee. Reserve your table.',
    category: 'social',
    tier: 'platinum',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    startAt: NOW,
    endAt: NOW + 8 * HOUR,
    qtyTotal: 12,
    qtyRemaining: 5,
    reserveFeePoints: 15,
    createdAt: NOW - 2 * HOUR,
    updatedAt: NOW,
  },
  {
    id: 'drop_6',
    partnerId: 'p12',
    partnerName: 'Mountain Mug Coffee',
    title: 'Afternoon Pastry Drop',
    description: 'Any pastry + espresso. First 15 today.',
    category: 'coffee',
    tier: 'silver',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    startAt: NOW,
    endAt: NOW + 6 * HOUR,
    qtyTotal: 15,
    qtyRemaining: 9,
    reserveFeePoints: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'drop_7',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    title: 'Late Night Bites',
    description: 'Taco trio + chips & salsa. After 9 PM.',
    category: 'food',
    tier: 'silver',
    imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
    startAt: NOW + 4 * HOUR,
    endAt: NOW + 10 * HOUR,
    qtyTotal: 20,
    qtyRemaining: 20,
    reserveFeePoints: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'drop_8',
    partnerId: 'p3',
    partnerName: 'Pub 447',
    title: 'Pro Night Special',
    description: 'Reserved booth + bottle. Pro members only.',
    category: 'social',
    tier: 'platinum',
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
    startAt: NOW,
    endAt: NOW + 6 * HOUR,
    qtyTotal: 5,
    qtyRemaining: 2,
    reserveFeePoints: 25,
    createdAt: NOW - HOUR,
    updatedAt: NOW,
  },
];

export const DROPS_STORAGE_KEY = 'ORBTAP_DROPS_V1';
export const RESERVATIONS_STORAGE_KEY = 'ORBTAP_RESERVATIONS_V1';
