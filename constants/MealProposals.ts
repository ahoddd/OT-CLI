/**
 * Meal Proposals — data model, types, mock data, and validation.
 * Partners publish Breakfast/Lunch/Dinner proposals for OrbSwipe.
 */

import type { PartnerTier } from './PartnerTiers';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type MealProposalStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'EXPIRED' | 'REMOVED';
export type MealCtaKind = 'NAVIGATE' | 'RESERVE' | 'CLAIM' | 'BOOK';
export type SphereTarget = 'SOLO' | 'COUPLE' | 'PAL' | 'FAMILY';
export type MealVibeTag =
  | 'date_night'
  | 'family'
  | 'friends'
  | 'budget'
  | 'healthy'
  | 'quick_bite'
  | 'celebration';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  BREAKFAST: 'sunny-outline',
  LUNCH: 'restaurant-outline',
  DINNER: 'moon-outline',
};

export const MEAL_VIBE_TAGS: { id: MealVibeTag; label: string; icon: string }[] = [
  { id: 'date_night', label: 'Date Night', icon: 'heart' },
  { id: 'family', label: 'Family', icon: 'people' },
  { id: 'friends', label: 'Friends', icon: 'beer' },
  { id: 'budget', label: 'Budget', icon: 'wallet' },
  { id: 'healthy', label: 'Healthy', icon: 'leaf' },
  { id: 'quick_bite', label: 'Quick Bite', icon: 'flash' },
  { id: 'celebration', label: 'Celebration', icon: 'sparkles' },
];

export const SPHERE_TARGET_LABELS: Record<SphereTarget, string> = {
  SOLO: 'Solo',
  COUPLE: 'CoupleSphere',
  PAL: 'PalSphere',
  FAMILY: 'FamilySphere',
};

export const PARTY_SIZE_PRESETS = [1, 2, 4, 6, 10] as const;

export const BUDGET_PRESETS = [
  { id: 'under10', label: 'Under $10', maxCents: 1000 },
  { id: 'under20', label: 'Under $20', maxCents: 2000 },
  { id: 'under35', label: 'Under $35', maxCents: 3500 },
  { id: 'any', label: 'Any', maxCents: Infinity },
] as const;

export const RADIUS_PRESETS_MI = [1, 5, 10, 15] as const;

export interface MealMenuItem {
  name: string;
  description?: string;
  priceCents?: number;
}

export interface MealProposalPricing {
  priceCentsPerPerson?: number;
  priceCentsTotal?: number;
  currency: string;
  includesTaxTipNote?: string;
}

export interface MealProposalAvailability {
  daysOfWeek?: number[];
  startAt?: number;
  endAt?: number;
  expiresAt?: number;
}

export interface MealProposalTargeting {
  radiusMiles?: number;
  tags?: MealVibeTag[];
  sphereTargets?: SphereTarget[];
}

export interface MealProposalCta {
  kind: MealCtaKind;
  dropId?: string;
  partnerSection?: string;
}

export interface MealProposalTrust {
  requiresPartnerVerified: boolean;
  moderationFlags?: string[];
}

export interface MealProposalAnalytics {
  impressions: number;
  opens: number;
  trayAdds: number;
  fuseSelects: number;
  navigations: number;
  reservations: number;
  verifiedRedemptions: number;
}

export interface MealProposal {
  id: string;
  partnerId: string;
  status: MealProposalStatus;
  mealType: MealType;
  title: string;
  description: string;
  photos: string[];
  pricing: MealProposalPricing;
  partySize: {
    minPeople: number;
    maxPeople: number;
    recommendedPeople?: number;
  };
  menuItems: MealMenuItem[];
  availability: MealProposalAvailability;
  targeting: MealProposalTargeting;
  cta: MealProposalCta;
  trust: MealProposalTrust;
  analytics: MealProposalAnalytics;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  /** Cached partner fields for display. */
  partnerName?: string;
  partnerTier?: PartnerTier;
  partnerVerified?: boolean;
  partnerLogoUrl?: string;
}

export type MealProposalActionType =
  | 'IMPRESSION'
  | 'OPEN'
  | 'SWIPE_RIGHT_TRAY'
  | 'SWIPE_LEFT_DISMISS'
  | 'SUPER_ORB'
  | 'FUSE_SELECT'
  | 'NAVIGATE'
  | 'RESERVE'
  | 'CLAIM';

export type MealActionPlacement = 'ORGANIC' | 'SPONSORED';

export interface MealProposalAction {
  id: string;
  proposalId: string;
  uid: string;
  action: MealProposalActionType;
  createdAt: number;
  placement: MealActionPlacement;
}

export type MealPlanScope = 'SOLO' | 'SPHERE';
export type MealPlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELED';
export type MealPlanStepType = 'NAVIGATE_TO_PARTNER' | 'DROP_RESERVE' | 'QR_REDEEM' | 'VERIFIED_REVIEW';

export interface MealPlanStep {
  type: MealPlanStepType;
  label: string;
  completed: boolean;
  refId?: string;
}

export interface MealPlan {
  id: string;
  createdByUid: string;
  scope: MealPlanScope;
  sphereId?: string;
  proposalIds: string[];
  selectedProposalId: string;
  partnerId: string;
  scheduledFor?: 'NOW' | number;
  partySizeChosen: number;
  budgetCents: number;
  steps: MealPlanStep[];
  status: MealPlanStatus;
  createdAt: number;
  updatedAt: number;
  /** Verified action id when plan is completed via QR check-in. */
  verifiedActionId?: string;
  /** Proof id minted on completion. */
  proofId?: string;
}

export interface MealSphereVote {
  proposalId: string;
  memberId: string;
  createdAt: number;
}

// ─── Validation ──────────────────────────────────────────

export const MEAL_TITLE_MIN = 6;
export const MEAL_TITLE_MAX = 60;
export const MEAL_DESC_MIN = 20;
export const MEAL_DESC_MAX = 240;
export const MEAL_PHOTOS_MAX = 3;
export const MEAL_MENU_ITEMS_MIN = 1;
export const MEAL_MENU_ITEMS_MAX = 10;
export const MEAL_REVIEW_TEXT_MIN = 8;

const LINK_REGEX = /https?:\/\/|www\./i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d[\d\s-]{7,})/;

export function containsExternalContent(text: string): boolean {
  return LINK_REGEX.test(text) || EMAIL_REGEX.test(text) || PHONE_REGEX.test(text);
}

export interface MealValidationError {
  field: string;
  message: string;
}

export function validateMealProposal(p: Partial<MealProposal>): MealValidationError[] {
  const errors: MealValidationError[] = [];

  if (!p.mealType) errors.push({ field: 'mealType', message: 'Meal type is required' });

  if (!p.title || p.title.length < MEAL_TITLE_MIN)
    errors.push({ field: 'title', message: `Title must be at least ${MEAL_TITLE_MIN} characters` });
  if (p.title && p.title.length > MEAL_TITLE_MAX)
    errors.push({ field: 'title', message: `Title must be at most ${MEAL_TITLE_MAX} characters` });
  if (p.title && containsExternalContent(p.title))
    errors.push({ field: 'title', message: 'No links, email, or phone numbers allowed' });

  if (!p.description || p.description.length < MEAL_DESC_MIN)
    errors.push({ field: 'description', message: `Description must be at least ${MEAL_DESC_MIN} characters` });
  if (p.description && p.description.length > MEAL_DESC_MAX)
    errors.push({ field: 'description', message: `Description must be at most ${MEAL_DESC_MAX} characters` });
  if (p.description && containsExternalContent(p.description))
    errors.push({ field: 'description', message: 'No links, email, or phone numbers allowed' });

  if (!p.menuItems || p.menuItems.length < MEAL_MENU_ITEMS_MIN)
    errors.push({ field: 'menuItems', message: 'At least one menu item is required' });
  if (p.menuItems && p.menuItems.length > MEAL_MENU_ITEMS_MAX)
    errors.push({ field: 'menuItems', message: `Maximum ${MEAL_MENU_ITEMS_MAX} menu items` });

  if (!p.pricing || (!p.pricing.priceCentsPerPerson && !p.pricing.priceCentsTotal))
    errors.push({ field: 'pricing', message: 'Price (per person or total) is required' });

  if (!p.partySize || p.partySize.minPeople < 1)
    errors.push({ field: 'partySize', message: 'Party size minimum must be at least 1' });

  return errors;
}

// ─── Time-of-day relevance ──────────────────────────────

export function getMealTypeForTime(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'BREAKFAST';
  if (hour >= 11 && hour < 16) return 'LUNCH';
  return 'DINNER';
}

export function getMealTimeRelevance(mealType: MealType, hour: number): number {
  const ideal = getMealTypeForTime(hour);
  if (mealType === ideal) return 1.0;
  const mapping: Record<MealType, number[]> = {
    BREAKFAST: [5, 11],
    LUNCH: [11, 16],
    DINNER: [16, 24],
  };
  const [start, end] = mapping[mealType];
  if (hour >= start && hour < end) return 1.0;
  const dist = Math.min(Math.abs(hour - start), Math.abs(hour - end));
  return Math.max(0.2, 1.0 - dist * 0.15);
}

// ─── Mock Data ──────────────────────────────────────────
// Demo meal cards for OrbSwipe Meals (meal-mode). All target SOLO/COUPLE/PAL/FAMILY and party 1–10 so sphere + filter combos always show cards.
// Partners: OrbTap Universe, Zack's Taco Shack (p1), Nick's Big Belly Deli (p2), Pub 447 (p3). Photos: Unsplash.

const ALL_SPHERE_TARGETS: SphereTarget[] = ['SOLO', 'COUPLE', 'PAL', 'FAMILY'];

export const MOCK_MEAL_PROPOSALS: MealProposal[] = [
  // —— Zack's Taco Shack (p1) ——
  {
    id: 'mp_demo_zack1',
    partnerId: 'p1',
    status: 'PUBLISHED',
    mealType: 'LUNCH',
    title: 'Taco Tuesday — 3 Tacos + Drink Under $12',
    description: 'Our famous house tacos: carnitas, al pastor, or veggie. Served with chips, salsa, and a drink. Limited spots — swipe to save your seat.',
    photos: ['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800'],
    pricing: { priceCentsPerPerson: 1199, currency: 'USD', includesTaxTipNote: 'Tax extra' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 2 },
    menuItems: [
      { name: 'Carnitas Tacos', description: 'Three soft tortillas', priceCents: 999 },
      { name: 'Al Pastor Tacos', description: 'Pineapple-marinated', priceCents: 999 },
      { name: 'House Drink', description: 'Soda, agua fresca, or horchata', priceCents: 299 },
    ],
    availability: { expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['quick_bite', 'budget', 'friends'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 15 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 312, opens: 98, trayAdds: 44, fuseSelects: 18, navigations: 22, reservations: 8, verifiedRedemptions: 6 },
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    partnerName: "Zack's Taco Shack",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_zack2',
    partnerId: 'p1',
    status: 'PUBLISHED',
    mealType: 'DINNER',
    title: 'Date Night Burrito Bowl for Two',
    description: 'Two build-your-own bowls with guac, queso, and a shared churro dessert. Earn bonus OT when you check in together.',
    photos: ['https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800'],
    pricing: { priceCentsPerPerson: 1499, currency: 'USD' },
    partySize: { minPeople: 2, maxPeople: 4, recommendedPeople: 2 },
    menuItems: [
      { name: 'Build-Your-Own Bowl', description: 'Rice, beans, protein, toppings', priceCents: 1299 },
      { name: 'Shared Churros', description: 'With chocolate dip', priceCents: 599 },
    ],
    availability: { expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['date_night', 'budget'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 10 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 189, opens: 62, trayAdds: 31, fuseSelects: 12, navigations: 15, reservations: 5, verifiedRedemptions: 4 },
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    partnerName: "Zack's Taco Shack",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_zack3',
    partnerId: 'p1',
    status: 'PUBLISHED',
    mealType: 'LUNCH',
    title: 'Family Fiesta — Kids Eat Free',
    description: 'Two adult combos and up to two kids meals free. Perfect for PalSphere or FamilySphere. Book before we run out.',
    photos: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800'],
    pricing: { priceCentsTotal: 2999, currency: 'USD' },
    partySize: { minPeople: 2, maxPeople: 8, recommendedPeople: 4 },
    menuItems: [
      { name: 'Adult Combo', description: 'Two tacos + drink', priceCents: 1299 },
      { name: 'Kids Meal', description: 'Free with adult combo', priceCents: 0 },
    ],
    availability: { expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['family', 'budget', 'friends'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 15 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 245, opens: 71, trayAdds: 38, fuseSelects: 14, navigations: 19, reservations: 7, verifiedRedemptions: 5 },
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    partnerName: "Zack's Taco Shack",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  // —— Nick's Big Belly Deli (p2) ——
  {
    id: 'mp_demo_nick1',
    partnerId: 'p2',
    status: 'PUBLISHED',
    mealType: 'BREAKFAST',
    title: 'Rise & Shine — Coffee + Pastry for Under $10',
    description: 'Grab a fresh-brewed coffee and your choice of muffin, croissant, or breakfast sandwich. Solo or with a pal — we\'ve got you.',
    photos: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800'],
    pricing: { priceCentsPerPerson: 999, currency: 'USD' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 1 },
    menuItems: [
      { name: 'Coffee', description: 'Any size', priceCents: 399 },
      { name: 'Breakfast Sandwich', description: 'Egg, cheese, choice of meat', priceCents: 699 },
      { name: 'Muffin or Croissant', priceCents: 399 },
    ],
    availability: { expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['quick_bite', 'budget', 'healthy'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 10 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 421, opens: 134, trayAdds: 67, fuseSelects: 24, navigations: 41, reservations: 12, verifiedRedemptions: 9 },
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    partnerName: "Nick's Big Belly Deli",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_nick2',
    partnerId: 'p2',
    status: 'PUBLISHED',
    mealType: 'LUNCH',
    title: 'The Big Belly Special — Sandwich + Cookie + Drink',
    description: 'Our signature stacked sandwich with a free cookie and drink. Limited daily — reserve your spot and earn OT when you visit.',
    photos: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800'],
    pricing: { priceCentsPerPerson: 1399, currency: 'USD' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 2 },
    menuItems: [
      { name: 'Signature Sandwich', description: 'Deli meats, cheese, fixings', priceCents: 1099 },
      { name: 'Free Cookie', description: 'With sandwich', priceCents: 0 },
      { name: 'Drink', description: 'Fountain or bottled', priceCents: 299 },
    ],
    availability: { expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['quick_bite', 'budget', 'friends'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 10 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 278, opens: 89, trayAdds: 42, fuseSelects: 16, navigations: 28, reservations: 6, verifiedRedemptions: 5 },
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    partnerName: "Nick's Big Belly Deli",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_nick3',
    partnerId: 'p2',
    status: 'PUBLISHED',
    mealType: 'LUNCH',
    title: 'PalSphere Lunch — Two Sandwiches + Shareable Side',
    description: 'Bring your sphere. Two premium sandwiches and a large side to share. Check in together for bonus OT.',
    photos: ['https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800'],
    pricing: { priceCentsTotal: 2499, currency: 'USD' },
    partySize: { minPeople: 2, maxPeople: 6, recommendedPeople: 2 },
    menuItems: [
      { name: 'Premium Sandwich', description: 'Choice of two', priceCents: 1099 },
      { name: 'Shareable Side', description: 'Fries, coleslaw, or chips', priceCents: 499 },
    ],
    availability: { expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['friends', 'budget'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 15 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 156, opens: 48, trayAdds: 22, fuseSelects: 9, navigations: 12, reservations: 4, verifiedRedemptions: 3 },
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    partnerName: "Nick's Big Belly Deli",
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  // —— Pub 447 (p3) ——
  {
    id: 'mp_demo_pub1',
    partnerId: 'p3',
    status: 'PUBLISHED',
    mealType: 'DINNER',
    title: 'Burger + Brew — BOGO Draft Tonight',
    description: 'Our house burger with one craft draft. Add a second draft for half price. Perfect for date night or pals. Limited availability.',
    photos: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'],
    pricing: { priceCentsPerPerson: 1899, currency: 'USD', includesTaxTipNote: 'Tip not included' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 2 },
    menuItems: [
      { name: 'House Burger', description: 'Beef, cheese, fixings', priceCents: 1499 },
      { name: 'Craft Draft', description: 'BOGO eligible', priceCents: 699 },
    ],
    availability: { expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['date_night', 'friends', 'celebration'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 10 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 198, opens: 64, trayAdds: 29, fuseSelects: 11, navigations: 18, reservations: 5, verifiedRedemptions: 4 },
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    partnerName: 'Pub 447',
    partnerTier: 'gold',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_pub2',
    partnerId: 'p3',
    status: 'PUBLISHED',
    mealType: 'DINNER',
    title: 'Weekend Live Music — Appetizer Platter for the Table',
    description: 'Reserve a table for the weekend set. One shared appetizer platter included. Great for CoupleSphere or PalSphere.',
    photos: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'],
    pricing: { priceCentsPerPerson: 2499, currency: 'USD' },
    partySize: { minPeople: 2, maxPeople: 8, recommendedPeople: 4 },
    menuItems: [
      { name: 'Appetizer Platter', description: 'Wings, nachos, sliders', priceCents: 1999 },
      { name: 'Table reservation', description: 'For live music', priceCents: 0 },
    ],
    availability: { expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['celebration', 'friends', 'date_night'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 15 },
    cta: { kind: 'RESERVE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 134, opens: 41, trayAdds: 19, fuseSelects: 7, navigations: 9, reservations: 4, verifiedRedemptions: 3 },
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    partnerName: 'Pub 447',
    partnerTier: 'gold',
    partnerVerified: true,
  },
  // —— OrbTap Universe ——
  {
    id: 'mp_demo_ot1',
    partnerId: 'orbtap-universe',
    status: 'PUBLISHED',
    mealType: 'BREAKFAST',
    title: 'OrbTap Universe — Demo Breakfast Bundle',
    description: 'Try the full OrbTap experience. Coffee, pastries, and a demo perk redemption. Perfect for testing the app with your sphere.',
    photos: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
    pricing: { priceCentsPerPerson: 899, currency: 'USD' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 2 },
    menuItems: [
      { name: 'Coffee', description: 'Any style', priceCents: 499 },
      { name: 'Pastry', description: 'Muffin or croissant', priceCents: 499 },
      { name: 'Demo Perk', description: 'Redeem for OT Points', priceCents: 0 },
    ],
    availability: { expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['quick_bite', 'budget', 'friends'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 20 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 89, opens: 28, trayAdds: 12, fuseSelects: 5, navigations: 8, reservations: 2, verifiedRedemptions: 2 },
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    partnerName: 'OrbTap Universe',
    partnerTier: 'platinum',
    partnerVerified: true,
  },
  {
    id: 'mp_demo_ot2',
    partnerId: 'orbtap-universe',
    status: 'PUBLISHED',
    mealType: 'LUNCH',
    title: 'OrbTap Universe — Lunch Demo Deal',
    description: 'Sandwich, side, and a demo perk to test scan and earn. Bring your sphere and see how OrbTap works end to end.',
    photos: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'],
    pricing: { priceCentsPerPerson: 1299, currency: 'USD' },
    partySize: { minPeople: 1, maxPeople: 10, recommendedPeople: 2 },
    menuItems: [
      { name: 'Demo Sandwich', description: 'House special', priceCents: 999 },
      { name: 'Side', description: 'Chips or fruit', priceCents: 299 },
      { name: 'Demo Perk', description: 'Test redemption', priceCents: 0 },
    ],
    availability: { expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    targeting: { tags: ['budget', 'quick_bite', 'friends'], sphereTargets: ALL_SPHERE_TARGETS, radiusMiles: 20 },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    analytics: { impressions: 67, opens: 21, trayAdds: 9, fuseSelects: 4, navigations: 6, reservations: 1, verifiedRedemptions: 1 },
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    partnerName: 'OrbTap Universe',
    partnerTier: 'platinum',
    partnerVerified: true,
  },
];

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function getMealPriceLabel(p: MealProposal): string {
  if (p.pricing.priceCentsPerPerson) return `${formatCents(p.pricing.priceCentsPerPerson)}/person`;
  if (p.pricing.priceCentsTotal) return `${formatCents(p.pricing.priceCentsTotal)} total`;
  return 'Price varies';
}

export function estimateTotalCents(p: MealProposal, partySize: number): number {
  if (p.pricing.priceCentsPerPerson) return p.pricing.priceCentsPerPerson * partySize;
  if (p.pricing.priceCentsTotal) return p.pricing.priceCentsTotal;
  return 0;
}

export function getPartySizeLabel(p: MealProposal): string {
  if (p.partySize.minPeople === p.partySize.maxPeople) return `for ${p.partySize.minPeople}`;
  return `for ${p.partySize.minPeople}–${p.partySize.maxPeople}`;
}

export function getMenuHighlights(items: MealMenuItem[], max: number = 3): string[] {
  return items.slice(0, max).map((i) => i.name);
}

export function getWhyLabel(p: MealProposal, hour: number): string {
  const relevance = getMealTimeRelevance(p.mealType, hour);
  if (p.availability.expiresAt && p.availability.expiresAt - Date.now() < 3 * 60 * 60 * 1000) return 'Ends soon';
  if (p.analytics.verifiedRedemptions >= 5) return 'Trending';
  if (p.pricing.priceCentsPerPerson && p.pricing.priceCentsPerPerson <= 1500) return 'Great value';
  if (relevance >= 0.9) return 'Nearby';
  return 'Nearby';
}

export const EXPIRY_PRESETS = [
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { label: '48 hours', ms: 48 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
] as const;
