/**
 * Default Premium and Pro tier benefits. Admin can override via Admin Hub (stored in AsyncStorage).
 * Pro is the best tier with more and exclusive benefits; Premium is great but fewer.
 */

export interface TierBenefitItem {
  title: string;
  sub: string;
}

export interface TierBenefitsConfig {
  premiumUser: TierBenefitItem[];
  premiumPartner: TierBenefitItem[];
  proUser: TierBenefitItem[];
  proPartner: TierBenefitItem[];
}

export const DEFAULT_TIER_BENEFITS: TierBenefitsConfig = {
  premiumUser: [
    { title: 'OrbPass', sub: 'Exclusive monthly perks at every partner venue' },
    { title: '30-day stats & trends', sub: 'See your momentum over time with extended analytics' },
    { title: 'Compare to city rank', sub: 'See how you stack up locally against other explorers' },
    { title: 'Export reports', sub: 'Download your stats and history as CSV anytime' },
    { title: 'Premium badge', sub: 'Verified gold badge on your profile and proofs' },
    { title: 'Early drop access', sub: 'Reserve drops before Free users. First in line.' },
    { title: 'Unlimited partner follows', sub: 'Save as many partners as you want. No limits.' },
    { title: 'Up to 10 Spheres', sub: 'Join or create more invite-only groups with friends' },
    { title: 'Power-ups', sub: 'Shields to protect streaks, mission re-rolls, and bonus multipliers' },
    { title: 'OrbSignal (10/day)', sub: 'More daily forecasts and venue predictions' },
    { title: 'Saved routes & alerts', sub: 'Save favorite routes and get smart alerts for new drops' },
  ],
  premiumPartner: [
    { title: '30-day analytics & funnel', sub: 'See trends and view → tap → redeem' },
    { title: 'Export to CSV', sub: 'Use your data in spreadsheets or BI' },
    { title: 'Up to 10 active perks', sub: 'Seasonal offers, daily specials, member perks' },
    { title: 'Premium (Gold) badge', sub: 'Signals quality and boosts trust' },
    { title: 'Featured placement', sub: 'Get in front of more explorers' },
    { title: 'Drops & flash offers', sub: 'Time-limited deals that drive urgency' },
  ],
  proUser: [
    { title: 'Earliest drop access', sub: 'Reserve limited drops before Premium and Free' },
    { title: 'Pro badge', sub: 'Platinum verification — top tier on your profile' },
    { title: '1.2× XP & OT multiplier', sub: 'Earn 20% more on every scan, mission, and streak' },
    { title: 'Unlimited Spheres', sub: 'Create and join as many groups as you want' },
    { title: 'Unlimited OrbSignal', sub: 'Unlimited daily forecasts and real-time venue predictions' },
    { title: 'Dedicated support', sub: 'Direct channel for questions and issues. A real person.' },
    { title: 'Early access to new features', sub: 'First to try new OrbTap product features' },
    { title: 'Priority featured in Pulse', sub: 'Priority eligibility to be highlighted in discovery feeds' },
    { title: 'Everything in Premium', sub: 'OrbPass, 30-day stats, export, power-ups, unlimited follows' },
  ],
  proPartner: [
    { title: 'Unlimited active perks', sub: 'No cap — run as many offers and promos as you want' },
    { title: 'Sponsored carousel slots', sub: 'Your venue in Pulse and high-traffic discovery' },
    { title: 'Priority in search & discovery', sub: 'Shown above Premium and Free in nearby and categories' },
    { title: 'Pro partner badge', sub: 'Platinum verification — stands out on map and profile' },
    { title: 'Dedicated success contact', sub: 'A real person for onboarding, strategy, and growth' },
    { title: 'Full analytics + export', sub: '30-day trends, conversion funnel, CSV' },
    { title: 'Early access to new features', sub: 'First to use new drops, ads, and OrbTap tools' },
    { title: 'Custom campaign support', sub: 'Featured in local promos when OrbTap runs campaigns' },
  ],
};

export const TIER_BENEFITS_STORAGE_KEY = 'ORBTAP_TIER_BENEFITS_V1';
