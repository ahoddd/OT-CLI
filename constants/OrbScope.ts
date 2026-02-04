/**
 * OrbScope™ — Daily Vibe types, templates, and action routing.
 * Opt-in only; one card per day; routes to Drops/Quests/Pulse/Circle/First Proof.
 * Blueprint: docs/BUILD/ORBSCOPE_SPEC.md
 */

export type OrbScopeActionType = 'DROP' | 'QUEST' | 'PULSE' | 'CIRCLE' | 'FIRST_PROOF';

export interface OrbScopeSettings {
  enabled: boolean;
  zodiacSign?: string;
  categories?: string[];
  notificationsEnabled?: boolean;
}

export interface OrbScopeDaily {
  dateKey: string;
  vibeId: string;
  vibeText: string;
  actionType: OrbScopeActionType;
  actionPrompt: string;
  actionRef?: { dropFilter?: string; questId?: string; pulseFilter?: string; circlePrefill?: string };
  createdAt: number;
}

export interface OrbScopeStreak {
  currentStreakCount: number;
  lastViewedDateKey: string;
  lastCompletedActionDateKey: string;
}

/** Vibe template: vibeText <= 120 chars, actionPrompt <= 70 chars */
export interface OrbScopeTemplate {
  id: string;
  actionType: OrbScopeActionType;
  vibeText: string;
  actionPrompt: string;
}

const DROP_TEMPLATES: OrbScopeTemplate[] = [
  { id: 'drop1', actionType: 'DROP', vibeText: 'Something limited is live. Your move.', actionPrompt: 'Catch a limited drop' },
  { id: 'drop2', actionType: 'DROP', vibeText: 'Scarcity creates clarity. See what\'s available now.', actionPrompt: 'Reserve a drop today' },
  { id: 'drop3', actionType: 'DROP', vibeText: 'Today\'s drop window won\'t wait. Check it.', actionPrompt: 'Catch a limited drop' },
  { id: 'drop4', actionType: 'DROP', vibeText: 'Limited quantity, full experience.', actionPrompt: 'Reserve before it\'s gone' },
  { id: 'drop5', actionType: 'DROP', vibeText: 'The best rewards go fast. Get in.', actionPrompt: 'Catch a limited drop' },
];

const QUEST_TEMPLATES: OrbScopeTemplate[] = [
  { id: 'quest1', actionType: 'QUEST', vibeText: 'A small quest today leads to points and discovery.', actionPrompt: 'Try a new coffee spot' },
  { id: 'quest2', actionType: 'QUEST', vibeText: 'Your daily mission is ready. One action, real reward.', actionPrompt: 'Complete a mission' },
  { id: 'quest3', actionType: 'QUEST', vibeText: 'Earn by doing. Pick a mission and go.', actionPrompt: 'Start a quest' },
  { id: 'quest4', actionType: 'QUEST', vibeText: 'Today\'s vibe: action. Open missions and choose one.', actionPrompt: 'Try a new spot' },
  { id: 'quest5', actionType: 'QUEST', vibeText: 'Points wait for those who move. Your quest awaits.', actionPrompt: 'Complete a mission' },
  { id: 'quest6', actionType: 'QUEST', vibeText: 'One verified win today. Make it count.', actionPrompt: 'Start a quest' },
];

const PULSE_TEMPLATES: OrbScopeTemplate[] = [
  { id: 'pulse1', actionType: 'PULSE', vibeText: 'The city is moving. See where the energy is.', actionPrompt: 'Go where the city is moving' },
  { id: 'pulse2', actionType: 'PULSE', vibeText: 'Live picks are in. Discover what\'s trending now.', actionPrompt: 'View Pulse picks' },
  { id: 'pulse3', actionType: 'PULSE', vibeText: 'Trending spots and drops, verified. Your discovery awaits.', actionPrompt: 'Open OrbPulse Live' },
  { id: 'pulse4', actionType: 'PULSE', vibeText: 'Today\'s vibe: discovery. See what\'s hot right now.', actionPrompt: 'Go where the city is moving' },
  { id: 'pulse5', actionType: 'PULSE', vibeText: 'The pulse of the city is live. Tap in.', actionPrompt: 'View Pulse picks' },
];

const CIRCLE_TEMPLATES: OrbScopeTemplate[] = [
  { id: 'circle1', actionType: 'CIRCLE', vibeText: 'Bring a friend. Shared wins hit different.', actionPrompt: 'Bring a friend tonight' },
  { id: 'circle2', actionType: 'CIRCLE', vibeText: 'Your circle is one tap away. Plan something together.', actionPrompt: 'Create a Circle plan' },
  { id: 'circle3', actionType: 'CIRCLE', vibeText: 'Today\'s vibe: together. Open your Circle.', actionPrompt: 'Bring a friend tonight' },
  { id: 'circle4', actionType: 'CIRCLE', vibeText: 'Group energy multiplies. Invite someone to the plan.', actionPrompt: 'Create a Circle plan' },
];

const FIRST_PROOF_TEMPLATES: OrbScopeTemplate[] = [
  { id: 'proof1', actionType: 'FIRST_PROOF', vibeText: 'Your first verified win is one scan away.', actionPrompt: 'Get your first OrbProof' },
  { id: 'proof2', actionType: 'FIRST_PROOF', vibeText: 'Today: prove it. Scan at a partner and earn.', actionPrompt: 'Earn your first proof' },
  { id: 'proof3', actionType: 'FIRST_PROOF', vibeText: 'The best vibe starts with one verified action.', actionPrompt: 'Get your first OrbProof' },
];

const ALL_TEMPLATES: OrbScopeTemplate[] = [
  ...DROP_TEMPLATES,
  ...QUEST_TEMPLATES,
  ...PULSE_TEMPLATES,
  ...CIRCLE_TEMPLATES,
  ...FIRST_PROOF_TEMPLATES,
];

export function getTemplatesByActionType(actionType: OrbScopeActionType): OrbScopeTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.actionType === actionType);
}

export function getRandomTemplateForActionType(actionType: OrbScopeActionType, dateKey: string): OrbScopeTemplate {
  const list = getTemplatesByActionType(actionType);
  const seed = dateKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const idx = Math.abs(seed) % list.length;
  return list[idx];
}

export function getDateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const ORBSCOPE_DAILY_KEY = 'ORBTAP_ORBSCOPE_DAILY_V1';
export const ORBSCOPE_STREAK_KEY = 'ORBTAP_ORBSCOPE_STREAK_V1';
