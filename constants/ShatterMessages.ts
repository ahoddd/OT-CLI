/** Catchy messages shown under earned OT Points when the orb shatters. One picked at random each time. */
export const SHATTER_MESSAGES = [
  'OrbTap Shatters The Norm!',
  'You just broke the ordinary.',
  'Another orb, another win.',
  'Shatter limits. Earn more.',
  'That’s how OrbTap rolls.',
  'You’re on a different level.',
  'Normal is overrated.',
  'OrbTap = unstoppable.',
  'Crush the routine.',
  'Rewards don’t wait.',
  'One tap closer to legendary.',
  'The grid favors the bold.',
  'OrbTap rewards the bold.',
  'Shatter. Earn. Repeat.',
  'Your move just paid off.',
  'This is the OrbTap way.',
  'Breaking orbs, earning rewards.',
  'You’re in the orb zone.',
  'OrbTap keeps the wins coming.',
  'Routine: shattered. Points: earned.',
];

export function getRandomShatterMessage(): string {
  return SHATTER_MESSAGES[Math.floor(Math.random() * SHATTER_MESSAGES.length)];
}
