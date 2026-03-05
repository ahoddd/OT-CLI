/**
 * OrbPulse Commerce Feed (OrbFeed) — OrbPost types and config.
 * Strict post types; proof-backed CTAs; server-authoritative stats when wired.
 */

export type OrbPostType =
  | 'DROP'
  | 'MENU_ITEM'
  | 'PRODUCT'
  | 'EVENT'
  | 'SERVICE_SLOT'
  | 'ANNOUNCEMENT'
  | 'RESTOCK'
  | 'STORY';

export type CtaKind = 'CLAIM' | 'RESERVE' | 'BUY' | 'NAVIGATE' | 'SAVE' | 'PLAN';
export type ModerationStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'REMOVED';

export interface OrbPostCta {
  kind: CtaKind;
  targetRef: string; // dropId | productId | urlInternal | workOrderCategory
  priceCents?: number;
  currency?: string;
}

export interface OrbPostScarcity {
  quantityTotal?: number;
  quantityRemaining?: number;
  expiresAt?: number;
  windowStartAt?: number;
  windowEndAt?: number;
}

export interface OrbPostTrust {
  partnerVerifiedRequired: boolean;
  moderationStatus: ModerationStatus;
  /** 'system' = full moderation passed; 'bypass' = admin had moderation off. Free-speech users see both. */
  moderatedBy?: 'system' | 'bypass';
}

export interface OrbPostStats {
  impressions?: number;
  opens?: number;
  saves?: number;
  shares?: number;
  ctaClicks?: number;
  claims?: number;
  redemptionsVerified?: number;
  purchases?: number;
  revenueAttributedCents?: number;
}

export interface OrbPost {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerVerified: boolean;
  cityId: string;
  type: OrbPostType;
  title: string;
  body: string;
  mediaRefs: string[];
  tags: string[];
  cta: OrbPostCta;
  scarcity?: OrbPostScarcity;
  trust: OrbPostTrust;
  ranking?: { score: number; lastMomentumAt: number };
  stats?: OrbPostStats;
  boosted?: boolean;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const SIX_HOURS = 6 * HOUR;

function mockPost(overrides: Partial<OrbPost> & Pick<OrbPost, 'id' | 'partnerId' | 'partnerName' | 'type' | 'title' | 'body' | 'cta'>): OrbPost {
  return {
    partnerVerified: true,
    cityId: 'default',
    mediaRefs: [],
    tags: [],
    trust: { partnerVerifiedRequired: true, moderationStatus: 'PUBLISHED' },
    stats: { impressions: 0, opens: 0, saves: 0, ctaClicks: 0, claims: 0, redemptionsVerified: 0 },
    createdAt: NOW - 2 * HOUR,
    updatedAt: NOW,
    publishedAt: NOW - 2 * HOUR,
    ...overrides,
  };
}

/** Mock OrbPosts for Commerce Feed (replace with API when backend ready). */
export const MOCK_ORB_POSTS: OrbPost[] = [
  mockPost({
    id: 'post_drop_1',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    type: 'DROP',
    title: 'Free Taco Drop — Today Only',
    body: 'One free taco with any drink purchase. Limited to 20 redemptions. Show this post at the counter.',
    cta: { kind: 'RESERVE', targetRef: 'drop_1', currency: 'USD' },
    scarcity: { quantityTotal: 20, quantityRemaining: 12, expiresAt: NOW + 8 * HOUR, windowEndAt: NOW + 8 * HOUR },
    tags: ['food', 'deals'],
    mediaRefs: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=200&fit=crop'],
    stats: { ...{}, impressions: 120, opens: 45, ctaClicks: 18, claims: 8, redemptionsVerified: 5 },
  }),
  mockPost({
    id: 'post_event_1',
    partnerId: 'p2',
    partnerName: 'Joe\'s Coffee',
    type: 'EVENT',
    title: 'Live Music Tonight 7–9pm',
    body: 'Acoustic set in the backyard. No cover. Reserve a table to guarantee a spot. First 10 get a free house coffee.',
    cta: { kind: 'RESERVE', targetRef: 'event_1', currency: 'USD' },
    scarcity: { quantityRemaining: 10, windowStartAt: NOW, windowEndAt: NOW + SIX_HOURS },
    tags: ['events', 'nightlife'],
    mediaRefs: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=200&fit=crop'],
    stats: { impressions: 89, opens: 32, saves: 12, ctaClicks: 9 },
  }),
  mockPost({
    id: 'post_product_1',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    type: 'PRODUCT',
    title: 'New: Breakfast Burrito',
    body: 'Eggs, chorizo, cheese, and our house salsa. Available 8am–11am. Claim with OT Points or pay at counter.',
    cta: { kind: 'CLAIM', targetRef: 'perk_breakfast_burrito', priceCents: 899, currency: 'USD' },
    tags: ['food'],
    mediaRefs: ['https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=200&fit=crop'],
    stats: { impressions: 200, opens: 67, ctaClicks: 22, redemptionsVerified: 14 },
  }),
  mockPost({
    id: 'post_announcement_1',
    partnerId: 'p2',
    partnerName: 'Joe\'s Coffee',
    type: 'ANNOUNCEMENT',
    title: 'We\'re Open Late This Weekend',
    body: 'Friday and Saturday until 11pm. Come study or hang out. Full menu plus evening specials.',
    cta: { kind: 'NAVIGATE', targetRef: 'partner_p2', currency: 'USD' },
    tags: ['food', 'coffee'],
    mediaRefs: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop'],
  }),
  mockPost({
    id: 'post_drop_2',
    partnerId: 'p2',
    partnerName: 'Joe\'s Coffee',
    type: 'DROP',
    title: 'Half-Off Cold Brew — Tonight',
    body: 'Expires at closing. One per person. Show your OrbTap proof at register.',
    cta: { kind: 'CLAIM', targetRef: 'drop_2', currency: 'USD' },
    scarcity: { quantityRemaining: 15, expiresAt: NOW + SIX_HOURS, windowEndAt: NOW + SIX_HOURS },
    tags: ['coffee', 'deals'],
    boosted: true,
    mediaRefs: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=200&fit=crop'],
    stats: { impressions: 340, opens: 120, ctaClicks: 45, redemptionsVerified: 28 },
  }),
  mockPost({
    id: 'post_menu_1',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    type: 'MENU_ITEM',
    title: "Just added 4 items to the menu!",
    body: "Zack's Taco Shack just added 4 new items to their food menu! See the full menu and details on Zack's Taco Shack Partner Page.",
    cta: { kind: 'NAVIGATE', targetRef: 'partner_p1', currency: 'USD' },
    mediaRefs: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop'],
    tags: ['food', 'menu'],
    stats: { impressions: 89, opens: 34, ctaClicks: 12 },
  }),
  mockPost({
    id: 'post_restock_1',
    partnerId: 'p3',
    partnerName: 'Brew & Grind',
    type: 'RESTOCK',
    title: 'Fresh roast back in stock',
    body: 'Our popular single-origin Ethiopian is back. Grab a bag with OT Points or at the counter. Limited bags available.',
    cta: { kind: 'BUY', targetRef: 'product_ethiopian', priceCents: 1499, currency: 'USD' },
    mediaRefs: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=200&fit=crop'],
    tags: ['coffee', 'retail'],
    scarcity: { quantityRemaining: 25 },
    stats: { impressions: 156, opens: 44, ctaClicks: 18 },
  }),
  mockPost({
    id: 'post_announcement_2',
    partnerId: 'p1',
    partnerName: "Zack's Taco Shack",
    type: 'ANNOUNCEMENT',
    title: 'New location opening next month',
    body: 'We\'re opening a second location downtown. Follow us for opening day deals and early access.',
    cta: { kind: 'NAVIGATE', targetRef: 'partner_p1', currency: 'USD' },
    mediaRefs: ['https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&h=200&fit=crop'],
    tags: ['food', 'news'],
  }),
  mockPost({
    id: 'post_service_1',
    partnerId: 'p4',
    partnerName: 'Urban Cuts',
    type: 'SERVICE_SLOT',
    title: 'Book a cut this week — 10% off',
    body: 'Reserve a slot with our stylists and get 10% off when you show this post. Valid Mon–Thu.',
    cta: { kind: 'RESERVE', targetRef: 'service_booking', currency: 'USD' },
    mediaRefs: ['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=200&fit=crop'],
    tags: ['services', 'beauty'],
    scarcity: { windowEndAt: NOW + 7 * 24 * HOUR },
    stats: { impressions: 78, opens: 28, ctaClicks: 9 },
  }),
  mockPost({
    id: 'post_product_2',
    partnerId: 'p2',
    partnerName: 'Joe\'s Coffee',
    type: 'PRODUCT',
    title: 'New seasonal blend: Autumn Spice',
    body: 'Pumpkin, cinnamon, and our house espresso. Available hot or iced. Claim with OT Points or pay at counter.',
    cta: { kind: 'CLAIM', targetRef: 'perk_autumn_spice', priceCents: 599, currency: 'USD' },
    mediaRefs: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=200&fit=crop'],
    tags: ['coffee', 'seasonal'],
    stats: { impressions: 210, opens: 72, ctaClicks: 31, redemptionsVerified: 19 },
  }),
];

export type FeedMode = 'nearby' | 'tonight' | 'drops' | 'new' | 'services' | 'following' | 'deals' | 'polls';

export function getPostTypeLabel(type: OrbPostType): string {
  const labels: Record<OrbPostType, string> = {
    DROP: 'Drop',
    MENU_ITEM: 'Menu',
    PRODUCT: 'Product',
    EVENT: 'Event',
    SERVICE_SLOT: 'Service',
    ANNOUNCEMENT: 'Announcement',
    RESTOCK: 'Restock',
    STORY: 'Story',
  };
  return labels[type] ?? type;
}

/** Colors for post-type pill (top-right of feed card). Chosen for visibility in both light and dark mode. */
export function getPostTypeColor(type: OrbPostType): { bg: string; text: string } {
  const map: Record<OrbPostType, { bg: string; text: string }> = {
    DROP: { bg: '#ea580c', text: '#fff' },           // orange — limited-time deal
    MENU_ITEM: { bg: '#16a34a', text: '#fff' },     // green — menu update
    PRODUCT: { bg: '#2563eb', text: '#fff' },       // blue — product
    EVENT: { bg: '#7c3aed', text: '#fff' },        // purple — event
    SERVICE_SLOT: { bg: '#0891b2', text: '#fff' },  // cyan — service
    ANNOUNCEMENT: { bg: '#4b5563', text: '#fff' },  // gray — announcement
    RESTOCK: { bg: '#ca8a04', text: '#000' },      // yellow — restock
    STORY: { bg: '#be185d', text: '#fff' },        // pink — story
  };
  return map[type] ?? { bg: '#6b7280', text: '#fff' };
}

export function getCtaLabel(kind: CtaKind): string {
  const labels: Record<CtaKind, string> = {
    CLAIM: 'Claim',
    RESERVE: 'Reserve',
    BUY: 'Buy',
    NAVIGATE: 'Navigate',
    SAVE: 'Save',
    PLAN: 'Add to Plan',
  };
  return labels[kind] ?? kind;
}
