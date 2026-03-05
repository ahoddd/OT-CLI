/**
 * What to show on a user's public profile. All default to true (public by default).
 * Users and partners control these in Settings → Public Profile.
 */

export interface PublicProfileVisibility {
  showBadges: boolean;
  showStats: boolean;
  showBio: boolean;
  showTagline: boolean;
  showStreak: boolean;
}

export const DEFAULT_PUBLIC_PROFILE_VISIBILITY: PublicProfileVisibility = {
  showBadges: true,
  showStats: true,
  showBio: true,
  showTagline: true,
  showStreak: true,
};

export function mergeVisibility(
  existing: Partial<PublicProfileVisibility> | undefined,
  update: Partial<PublicProfileVisibility> | undefined
): PublicProfileVisibility {
  return {
    ...DEFAULT_PUBLIC_PROFILE_VISIBILITY,
    ...(existing || {}),
    ...(update || {}),
  };
}
