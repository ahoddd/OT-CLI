/**
 * OrbBank™ — Preset goal jar templates and top-up packages.
 * User creates named jars, routes scan earnings into them, tops up via IAP.
 */

export interface OrbBankGoalTemplate {
  key: string;
  label: string;
  emoji: string;
  targetOT: number;
  partnerCategoryTags: string[];
  description: string;
}

export const ORB_BANK_GOAL_TEMPLATES: OrbBankGoalTemplate[] = [
  {
    key: 'date_night',
    label: 'Date Night',
    emoji: '🍷',
    targetOT: 2000,
    partnerCategoryTags: ['dining', 'nightlife', 'cafe'],
    description: 'Save up for a special evening out.',
  },
  {
    key: 'family_night',
    label: 'Family Night Out',
    emoji: '🎉',
    targetOT: 3000,
    partnerCategoryTags: ['dining', 'entertainment', 'cafe'],
    description: 'A night everyone will remember.',
  },
  {
    key: 'friend_group',
    label: 'Friend Group Dinner',
    emoji: '🍕',
    targetOT: 4000,
    partnerCategoryTags: ['dining', 'nightlife'],
    description: 'Split the bill — or flex on everyone.',
  },
  {
    key: 'solo_treat',
    label: 'Solo Treat',
    emoji: '🧘',
    targetOT: 1000,
    partnerCategoryTags: ['cafe', 'fitness', 'services'],
    description: 'A little something just for you.',
  },
  {
    key: 'custom',
    label: 'Custom Goal',
    emoji: '⭐',
    targetOT: 1500,
    partnerCategoryTags: [],
    description: 'Set your own target and vibe.',
  },
];

export const ORB_BANK_AUTO_SAVE_OPTIONS = [
  { key: '0', label: 'Off', value: 0 },
  { key: '5', label: '5% of earnings', value: 5 },
  { key: '10', label: '10% of earnings', value: 10 },
  { key: '25', label: '25% of earnings', value: 25 },
];

export const ORB_BANK_TOPUP_PACKAGES = [
  {
    key: 'starter',
    label: 'Starter',
    ot: 500,
    usd: 5,
    bonus: 0,
    popular: false,
    appleProductId: 'com.orbtap.orbbank.500',
    googleProductId: 'orbbank_500',
  },
  {
    key: 'explorer',
    label: 'Explorer',
    ot: 1200,
    usd: 10,
    bonus: 200,
    popular: false,
    appleProductId: 'com.orbtap.orbbank.1200',
    googleProductId: 'orbbank_1200',
  },
  {
    key: 'adventurer',
    label: 'Adventurer',
    ot: 2800,
    usd: 20,
    bonus: 800,
    popular: true,
    appleProductId: 'com.orbtap.orbbank.2800',
    googleProductId: 'orbbank_2800',
  },
  {
    key: 'legend',
    label: 'Legend',
    ot: 8000,
    usd: 50,
    bonus: 3000,
    popular: false,
    appleProductId: 'com.orbtap.orbbank.8000',
    googleProductId: 'orbbank_8000',
  },
];
