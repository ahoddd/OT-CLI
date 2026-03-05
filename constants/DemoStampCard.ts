/**
 * Demo Stamp Cards for OrbTap Universe — admin/partner test account.
 * Multiple cards covering all three tier color palettes (Silver/Free, Gold/Premium, Platinum/Pro)
 * and varying progress states so the carousel can be fully tested.
 */

import type { StampProgram, StampCardState } from './StampCards';
import { ORBTAP_UNIVERSE_PARTNER_ID } from './MockData';

export const DEMO_STAMP_PROGRAM_ID = 'demo-orbtap-universe';

const NOW = Date.now();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// CARD 1 — Silver / Free tier look  (blue, COFFEE template, 3 of 8 stamps)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STAMP_PROGRAM_ORBTAP_UNIVERSE: StampProgram & { id: string } = {
  id: DEMO_STAMP_PROGRAM_ID,
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  status: 'ACTIVE',
  name: 'The Daily Grind — Coffee Card',
  description: 'Collect 8 stamps at The Daily Grind to earn a free coffee. One stamp per visit.',
  stampsRequired: 8,
  cooldownHours: 24,
  eligibility: { requireVerifiedUser: false, requirePartnerVerified: false },
  caps: { maxStampsPerUserPerDay: 1, maxRewardsPerDay: null },
  reward: {
    type: 'FREE_ITEM',
    label: '☕ Free coffee of your choice',
    expiresHoursAfterEarn: 72,
    otPointsBonus: 25,
  },
  design: {
    template: 'COFFEE',
    colors: { primary: '#1e3a5f', secondary: '#3b82f6' },
    iconLogoRef: 'coffee',
    stampStyle: 'ORB',
  },
  createdAt: NOW - 30 * ONE_DAY_MS,
  updatedAt: NOW,
};

export const DEMO_STAMP_STATE_ORBTAP_UNIVERSE: StampCardState & { id: string } = {
  id: 'demo-state-orbtap-universe',
  uid: '',
  programId: DEMO_STAMP_PROGRAM_ID,
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  stampCount: 3,
  lastStampAt: NOW - 2 * 60 * 60 * 1000,
  completedCount: 0,
  activeReward: null,
  updatedAt: NOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD 2 — Gold / Premium tier look  (amber/gold, RESTAURANT template, 7 of 10 stamps — almost there!)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STAMP_PROGRAM_GOLD: StampProgram & { id: string } = {
  id: 'demo-stamp-gold',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  status: 'ACTIVE',
  name: 'The Rustic Table — Diner\'s Club',
  description: 'Dine 10 times and earn a free dessert for the table. Premium partner exclusive.',
  stampsRequired: 10,
  cooldownHours: 6,
  eligibility: { requireVerifiedUser: false, requirePartnerVerified: false },
  caps: { maxStampsPerUserPerDay: 2, maxRewardsPerDay: null },
  reward: {
    type: 'FREE_ITEM',
    label: '🍮 Free dessert round for the table + 50 OT bonus',
    expiresHoursAfterEarn: 48,
    otPointsBonus: 50,
  },
  design: {
    template: 'RESTAURANT',
    colors: { primary: '#b45309', secondary: '#f59e0b' },
    iconLogoRef: 'restaurant',
    stampStyle: 'STAR',
  },
  createdAt: NOW - 14 * ONE_DAY_MS,
  updatedAt: NOW,
};

export const DEMO_STAMP_STATE_GOLD: StampCardState & { id: string } = {
  id: 'demo-state-gold',
  uid: '',
  programId: 'demo-stamp-gold',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  stampCount: 7,
  lastStampAt: NOW - 1 * 60 * 60 * 1000,
  completedCount: 1,
  activeReward: null,
  updatedAt: NOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD 3 — Platinum / Pro tier look  (purple/indigo, RETAIL template, reward EARNED — ready to redeem!)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STAMP_PROGRAM_PLATINUM: StampProgram & { id: string } = {
  id: 'demo-stamp-platinum',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  status: 'ACTIVE',
  name: 'Vertex Boutique — VIP Rewards',
  description: 'Earn 6 stamps at Vertex Boutique and unlock VIP Drop access + 100 bonus OT.',
  stampsRequired: 6,
  cooldownHours: 12,
  eligibility: { requireVerifiedUser: false, requirePartnerVerified: false },
  caps: { maxStampsPerUserPerDay: 1, maxRewardsPerDay: null },
  reward: {
    type: 'VIP_DROP_ACCESS',
    label: '💎 VIP Drop access + 100 OT bonus — Platinum exclusive',
    expiresHoursAfterEarn: 96,
    otPointsBonus: 100,
  },
  design: {
    template: 'RETAIL',
    colors: { primary: '#6d28d9', secondary: '#a78bfa' },
    iconLogoRef: 'diamond',
    stampStyle: 'SHIELD',
  },
  createdAt: NOW - 7 * ONE_DAY_MS,
  updatedAt: NOW,
};

export const DEMO_STAMP_STATE_PLATINUM: StampCardState & { id: string } = {
  id: 'demo-state-platinum',
  uid: '',
  programId: 'demo-stamp-platinum',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  stampCount: 6,
  lastStampAt: NOW - 3 * 60 * 60 * 1000,
  completedCount: 0,
  activeReward: { status: 'EARNED', earnedAt: NOW - 30 * 60 * 1000, expiresAt: NOW + 96 * 60 * 60 * 1000 } as any,
  updatedAt: NOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD 4 — Green / service tier  (SERVICE template, 1 of 5 stamps, just started)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STAMP_PROGRAM_SERVICE: StampProgram & { id: string } = {
  id: 'demo-stamp-service',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  status: 'ACTIVE',
  name: 'ZenCut Barbershop — Loyalty Club',
  description: 'Visit 5 times and get your 6th haircut free.',
  stampsRequired: 5,
  cooldownHours: 72,
  eligibility: { requireVerifiedUser: false, requirePartnerVerified: false },
  caps: { maxStampsPerUserPerDay: 1, maxRewardsPerDay: null },
  reward: {
    type: 'FREE_ITEM',
    label: '✂️ Free haircut + styling',
    expiresHoursAfterEarn: 168,
    otPointsBonus: null,
  },
  design: {
    template: 'SERVICE',
    colors: { primary: '#065f46', secondary: '#10b981' },
    iconLogoRef: 'service',
    stampStyle: 'CHECK',
  },
  createdAt: NOW - 5 * ONE_DAY_MS,
  updatedAt: NOW,
};

export const DEMO_STAMP_STATE_SERVICE: StampCardState & { id: string } = {
  id: 'demo-state-service',
  uid: '',
  programId: 'demo-stamp-service',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  stampCount: 1,
  lastStampAt: NOW - 4 * ONE_DAY_MS,
  completedCount: 0,
  activeReward: null,
  updatedAt: NOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD 5 — Rose / event  (EVENT template, completed × 2 — shows completed count)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STAMP_PROGRAM_EVENT: StampProgram & { id: string } = {
  id: 'demo-stamp-event',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  status: 'ACTIVE',
  name: 'Neon Arena — Event Pass',
  description: 'Attend 4 events at Neon Arena and earn a free VIP night entry.',
  stampsRequired: 4,
  cooldownHours: 0,
  eligibility: { requireVerifiedUser: false, requirePartnerVerified: false },
  caps: { maxStampsPerUserPerDay: 1, maxRewardsPerDay: null },
  reward: {
    type: 'FREE_ITEM',
    label: '🎟️ Free VIP entry + drink token',
    expiresHoursAfterEarn: 48,
    otPointsBonus: 75,
  },
  design: {
    template: 'EVENT',
    colors: { primary: '#be185d', secondary: '#f472b6' },
    iconLogoRef: 'event',
    stampStyle: 'STAR',
  },
  createdAt: NOW - 60 * ONE_DAY_MS,
  updatedAt: NOW,
};

export const DEMO_STAMP_STATE_EVENT: StampCardState & { id: string } = {
  id: 'demo-state-event',
  uid: '',
  programId: 'demo-stamp-event',
  partnerId: ORBTAP_UNIVERSE_PARTNER_ID,
  stampCount: 2,
  lastStampAt: NOW - 2 * ONE_DAY_MS,
  completedCount: 2,
  activeReward: null,
  updatedAt: NOW,
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_DEMO_STAMP_CARDS: Array<{
  state: StampCardState & { id: string };
  program: (StampProgram & { id: string }) | null;
}> = [
  { state: DEMO_STAMP_STATE_ORBTAP_UNIVERSE, program: DEMO_STAMP_PROGRAM_ORBTAP_UNIVERSE },
  { state: DEMO_STAMP_STATE_GOLD, program: DEMO_STAMP_PROGRAM_GOLD },
  { state: DEMO_STAMP_STATE_PLATINUM, program: DEMO_STAMP_PROGRAM_PLATINUM },
  { state: DEMO_STAMP_STATE_SERVICE, program: DEMO_STAMP_PROGRAM_SERVICE },
  { state: DEMO_STAMP_STATE_EVENT, program: DEMO_STAMP_PROGRAM_EVENT },
];

/** Build card + program for the OrbTap Universe demo (shape matches StampCardWithProgram). */
export function getDemoStampCardWithProgram(): {
  state: StampCardState & { id: string };
  program: (StampProgram & { id: string }) | null;
} {
  return {
    state: DEMO_STAMP_STATE_ORBTAP_UNIVERSE,
    program: DEMO_STAMP_PROGRAM_ORBTAP_UNIVERSE,
  };
}

/** Check if a program or partner is the OrbTap Universe demo. */
export function isOrbTapUniverseStamp(partnerId: string | undefined, programId?: string): boolean {
  return (
    partnerId === ORBTAP_UNIVERSE_PARTNER_ID ||
    programId === DEMO_STAMP_PROGRAM_ID ||
    programId === 'demo-stamp-gold' ||
    programId === 'demo-stamp-platinum' ||
    programId === 'demo-stamp-service' ||
    programId === 'demo-stamp-event'
  );
}
