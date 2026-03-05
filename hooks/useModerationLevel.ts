/**
 * Resolves effective moderation level for the current user.
 * When admin has moderation OFF, or user chose Free Speech mode: illegal_only (platform liability only).
 * Otherwise: full (profanity + immoral + illegal).
 */

import type { ModerationLevel } from '../utils/moderation';
import { useFlags } from '../components/FlagContext';
import { usePreferences } from './usePreferences';

export function useModerationLevel(): ModerationLevel {
  const { flags } = useFlags();
  const { prefs } = usePreferences();

  if (!flags.isOrbFeedModerationEnabled) return 'illegal_only';
  if (prefs.contentMode === 'freeSpeech') return 'illegal_only';
  return 'full';
}
