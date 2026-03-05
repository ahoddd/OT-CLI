/**
 * Content moderation — profanity, immoral patterns, illegal.
 * Used before publishing partner posts.
 * Admin can disable via isOrbFeedModerationEnabled = false.
 * Free speech mode (user opt-in) still blocks illegal content.
 */

/** Expanded profanity and inappropriate content patterns. Leetspeak and common variants. */
const PROFANITY_PATTERNS = [
  // Strong profanity
  /\b(fuck|fuk|fck|fuc|fuq|cunt|c\*nt|shit|sht|sh1t|sh!t|asshole|bitch|b1tch|whore|slut|dickhead)\b/gi,
  /\b(dammit|darnit|wtf|stfu|stf?\s*u|f\s*u\s*c\s*k|bs|crap|dumbass)\b/gi,
  // Slurs (racial, sexual orientation, ableist)
  /\b(n[i1l]gg[a3e]|n[i1l]g{2,}|f[a4@]gg[o0]t|f[a4@]g+ot|r[e3]t[a4@]rd|r[e3]t[a4@]rds)\b/gi,
  /\b(tr[o0]nny|tr[a4]nny)\b/gi,
  // Self-harm / violence
  /\b(k[i1]ll\s*(your)?self|kys|hang\s*(your)?self|cut\s*(your)?self)\b/gi,
  // Sexual explicit (minimal; app-appropriate)
  /\b(pornhub|xvideos|xnxx)\b/gi,
  // Additional vulgar
  /\b(motherfucker|mfer|mf\s*er|bullshit)\b/gi,
  /\b(dick|penis|cock)\s+(pic|image|photo)\b/gi,
];

/**
 * Substring-based profanity list to catch attempts to bypass filters by
 * inserting spaces or punctuation between letters (e.g. "f u c k", "fu ck",
 * "sh it", etc.). We run these checks on a heavily normalized version of the
 * text with non-alphanumerics stripped out, so "f u c k!" becomes "fuck".
 */
const PROFANITY_SUBSTRINGS = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'whore',
  'slut',
  'dumbass',
  'asshole',
  'motherfucker',
];

/** Patterns that indicate illegal/high-risk content (could get platform sued). */
const ILLEGAL_PATTERNS = [
  /\b(child\s*porn|csam|minor\s*sex)\b/gi,
  /\b(hit\s*man|murder\s*for\s*hire)\b/gi,
  /\b(how\s*to\s*make\s*bomb|build\s*explosive)\b/gi,
  /\b(illegal\s*drugs?\s*for\s*sale|buy\s*cocaine)\b/gi,
  /\b(steal\s*credentials|phishing\s*scam)\b/gi,
];

export type ModerationLevel = 'full' | 'illegal_only' | 'none';

export interface ModerationResult {
  passed: boolean;
  reason?: string;
  blockedPattern?: string;
}

/**
 * Run moderation on text.
 * @param text Combined title + body
 * @param level 'full' = profanity+immoral+illegal; 'illegal_only' = illegal only; 'none' = skip
 */
export function moderateContent(
  text: string,
  level: ModerationLevel
): ModerationResult {
  if (!text || typeof text !== 'string') return { passed: true };
  if (level === 'none') return { passed: true };

  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

  if (level === 'illegal_only') {
    for (const pat of ILLEGAL_PATTERNS) {
      if (pat.test(normalized)) {
        return { passed: false, reason: 'Content may violate laws.', blockedPattern: pat.source };
      }
    }
    return { passed: true };
  }

  // full: check illegal first, then profanity
  for (const pat of ILLEGAL_PATTERNS) {
    if (pat.test(normalized)) {
      return { passed: false, reason: 'Content may violate laws.', blockedPattern: pat.source };
    }
  }
  for (const pat of PROFANITY_PATTERNS) {
    if (pat.test(normalized)) {
      return { passed: false, reason: 'Content contains prohibited language.', blockedPattern: pat.source };
    }
  }

  // Extra hardening: run substring checks on a "squashed" version of the text
  // with all non-alphanumeric characters removed. This catches cases where
  // users try to insert spaces or punctuation inside a word to bypass regex.
  const squashed = normalized.replace(/[^a-z0-9]+/g, '');
  for (const sub of PROFANITY_SUBSTRINGS) {
    if (squashed.includes(sub)) {
      return { passed: false, reason: 'Content contains prohibited language.', blockedPattern: `substring:${sub}` };
    }
  }

  return { passed: true };
}
