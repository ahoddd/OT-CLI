/**
 * Missions mood presets — drive mission generation and map experience.
 * Users pick a mood; missions and map surface partners that match.
 */

export type MoodId =
  | 'chill'
  | 'foodie'
  | 'adventure'
  | 'quick_win'
  | 'night_out'
  | 'explore'
  | 'coffee_run'
  | 'family';

export interface MoodPreset {
  id: MoodId;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  /** Partner categories to prefer (Dining, Cafe, Nightlife, etc.) */
  categories: string[];
  /** Meal slots this mood fits (breakfast, lunch, dinner) */
  mealSlots: ('breakfast' | 'lunch' | 'dinner')[];
  /** Intensity: quick = 1 step, medium = 2, full = 3 */
  intensity: 'quick' | 'medium' | 'full';
  /** Short tag for map filter / deep link */
  mapTag: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: 'chill',
    label: 'Chill',
    sublabel: 'Low-key spots, no rush',
    icon: 'leaf',
    color: '#4ade80',
    categories: ['Cafe', 'Dining', 'Services'],
    mealSlots: ['breakfast', 'lunch', 'dinner'],
    intensity: 'medium',
    mapTag: 'chill',
  },
  {
    id: 'foodie',
    label: 'Foodie',
    sublabel: 'Eat your way through local',
    icon: 'restaurant',
    color: '#f59e0b',
    categories: ['Dining', 'Cafe'],
    mealSlots: ['breakfast', 'lunch', 'dinner'],
    intensity: 'full',
    mapTag: 'foodie',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    sublabel: 'Multiple stops, max rewards',
    icon: 'trail-sign',
    color: '#8b5cf6',
    categories: ['Entertainment', 'Retail', 'Hospitality', 'Dining'],
    mealSlots: ['lunch', 'dinner'],
    intensity: 'full',
    mapTag: 'adventure',
  },
  {
    id: 'quick_win',
    label: 'Quick Win',
    sublabel: 'One stop, instant OT',
    icon: 'flash',
    color: '#06b6d4',
    categories: ['Dining', 'Cafe', 'Retail'],
    mealSlots: ['breakfast', 'lunch', 'dinner'],
    intensity: 'quick',
    mapTag: 'quick',
  },
  {
    id: 'night_out',
    label: 'Night Out',
    sublabel: 'Bars, late bites',
    icon: 'moon',
    color: '#a855f7',
    categories: ['Nightlife', 'Dining'],
    mealSlots: ['dinner'],
    intensity: 'medium',
    mapTag: 'night',
  },
  {
    id: 'explore',
    label: 'Explore',
    sublabel: 'Discover new places',
    icon: 'compass',
    color: '#ec4899',
    categories: ['Retail', 'Entertainment', 'Dining', 'Services'],
    mealSlots: ['lunch', 'dinner'],
    intensity: 'full',
    mapTag: 'explore',
  },
  {
    id: 'coffee_run',
    label: 'Coffee Run',
    sublabel: 'Caffeine and a bite',
    icon: 'cafe',
    color: '#d97706',
    categories: ['Cafe', 'Dining'],
    mealSlots: ['breakfast', 'lunch'],
    intensity: 'quick',
    mapTag: 'coffee',
  },
  {
    id: 'family',
    label: 'Family',
    sublabel: 'Kid-friendly and fun',
    icon: 'people',
    color: '#22c55e',
    categories: ['Hospitality', 'Dining', 'Entertainment'],
    mealSlots: ['breakfast', 'lunch', 'dinner'],
    intensity: 'medium',
    mapTag: 'family',
  },
];

/** Title variations per mood — used by generator to vary mission titles. */
export const MISSION_TITLE_VARIATIONS: Record<MoodId, string[]> = {
  chill: ['Chill triple', 'Easy three-stop', 'Laid-back circuit', 'Low-key loop', 'Relaxed run'],
  foodie: ['Foodie crawl', 'Taste tour', 'Local bites circuit', 'Eat the block', 'Flavor run'],
  adventure: ['Adventure circuit', 'Explorer loop', 'Triple threat', 'Full run', 'Max mission'],
  quick_win: ['Quick win', 'One and done', 'Single stop', 'Instant mission', 'Fast earn'],
  night_out: ['Night out double', 'Evening run', 'Late double', 'Night crawl'],
  explore: ['Explore circuit', 'Discovery run', 'New spots triple', 'Explorer mission'],
  coffee_run: ['Coffee run', 'Caffeine stop', 'Morning grab', 'Quick brew'],
  family: ['Family run', 'Squad mission', 'Family loop', 'Kid-friendly circuit'],
};

/** Description variations per mood. */
export const MISSION_DESC_VARIATIONS: Record<MoodId, string[]> = {
  chill: ['Three chill check-ins. Earn OT and Sphere XP at your own pace.', 'Low-key stops at local spots. Your Spheres level up with you.', 'Take it easy — visit three partners and stack rewards.'],
  foodie: ['Check in at three food spots. Eat local, earn big.', 'Hit three dining partners. Your circles earn XP when you complete all steps.', 'Food crawl: three stops, max OT and Sphere XP.'],
  adventure: ['Three partners, one mission. Big rewards for you and your Spheres.', 'Full circuit: three check-ins. Proof-backed, real perks.', 'Adventure run — complete all steps to earn.'],
  quick_win: ['One stop, one scan. Instant OT Points and Sphere XP.', 'Single check-in to get your daily mission done.', 'Quick visit, quick earn.'],
  night_out: ['Two stops tonight. Check in, earn OT and Sphere XP.', 'Evening double — hit two partners and earn.', 'Night run: two check-ins, full rewards.'],
  explore: ['Discover three new spots. Check in and earn at each.', 'Explorer circuit: three partners, real rewards.', 'New places, same rewards. Complete all steps.'],
  coffee_run: ['Grab coffee (or a bite), check in, earn.', 'One stop for caffeine and OT.', 'Quick coffee run. Scan, earn, go.'],
  family: ['Family-friendly circuit. Two stops, rewards for everyone.', 'Kid-friendly run. Check in at two partners and earn.', 'Squad mission: two stops, Sphere XP for your circles.'],
};

export function getMoodPreset(id: MoodId): MoodPreset {
  const preset = MOOD_PRESETS.find((p) => p.id === id);
  if (!preset) return MOOD_PRESETS[0];
  return preset;
}

/** Steps count for intensity. */
export function getStepsForIntensity(intensity: MoodPreset['intensity']): number {
  switch (intensity) {
    case 'quick': return 1;
    case 'medium': return 2;
    case 'full': return 3;
    default: return 2;
  }
}

/** Pick a random title variation for a mood (seed optional for consistency). */
export function getTitleForMood(moodId: MoodId, index: number): string {
  const list = MISSION_TITLE_VARIATIONS[moodId] ?? MISSION_TITLE_VARIATIONS.quick_win;
  return list[index % list.length];
}

/** Pick a random description variation for a mood. */
export function getDescForMood(moodId: MoodId, index: number): string {
  const list = MISSION_DESC_VARIATIONS[moodId] ?? MISSION_DESC_VARIATIONS.quick_win;
  return list[index % list.length];
}
