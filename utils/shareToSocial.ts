/**
 * Share to social platforms — Facebook, X (Twitter), Instagram, TikTok.
 * Uses share URLs where supported (Facebook, X); system share sheet for Instagram/TikTok
 * so OrbTap grows via those platforms without sending users away unnecessarily.
 * Every share should include a link to OrbTap (app or store) via ORBTAP_APP_LINK.
 */

import { Linking, Share, Platform } from 'react-native';
import { ORBTAP_APP_LINK, DEFAULT_SHARE_MESSAGE } from '../constants/AppLinks';
import { proofShareMessage, FEED_SHARE_HOOK, PARTNER_SHARE_HOOK } from '../constants/ViralCopy';

/** Max length for X (Twitter) tweet text (url is added separately and counts as ~23 chars). */
const X_MAX_TEXT = 280 - 24;

export type SharePayload = {
  message: string;
  url?: string;
  title?: string;
  /** Optional image URI (e.g. proof card capture). Used when opening system share. */
  imageUri?: string;
};

/**
 * Open Facebook sharer with the given URL. Uses m2w on mobile for desktop-style sharer.
 * Tries Linking first; falls back to system share if opening fails.
 */
export async function shareUrlToFacebook(url: string, message?: string): Promise<void> {
  const u = url.trim();
  if (!u) return;
  const encoded = encodeURIComponent(u);
  // m2w forces desktop sharer on mobile for better compatibility
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?m2w&u=${encoded}`;
  try {
    await Linking.openURL(fbUrl);
    return;
  } catch {
    // Fallback: system share so user can pick Facebook or others
  }
  const fallbackMessage = message ? `${message}\n${u}` : u;
  await Share.share({ message: fallbackMessage, title: 'Share to Facebook' });
}

/**
 * Open X (Twitter) intent with message and optional url. Truncates message if needed.
 * Tries twitter.com/intent/tweet first; falls back to system share if opening fails.
 */
export async function shareToX(message: string, url?: string): Promise<void> {
  let text = message.trim();
  if (url) {
    const u = url.trim();
    if (text.length + u.length + 1 > X_MAX_TEXT) text = text.slice(0, X_MAX_TEXT - u.length - 4) + '...';
    text = text + ' ' + u;
  } else if (text.length > X_MAX_TEXT) {
    text = text.slice(0, X_MAX_TEXT - 3) + '...';
  }
  const params = new URLSearchParams({ text });
  const intentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  try {
    await Linking.openURL(intentUrl);
    return;
  } catch {
    // Fallback: system share so user can pick X or others
  }
  await Share.share({ message: text, title: 'Share to X' });
}

/**
 * Open the system share sheet. Instagram, TikTok, UpScrolled, etc. appear as options when installed.
 * Always includes message + link in the shared text so pasting into any app works.
 */
export async function openSystemShareSheet(payload: SharePayload): Promise<void> {
  const { message, url, title, imageUri } = payload;
  const link = (url ?? ORBTAP_APP_LINK).trim();
  const text = message?.trim() || DEFAULT_SHARE_MESSAGE;
  const shareMessage = link ? `${text}\n${link}`.trim() : text;
  if (!shareMessage) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          text: shareMessage,
          title: title ?? 'OrbTap',
        });
      }
      return;
    }
    if (imageUri) {
      await Share.share({ message: shareMessage, url: imageUri, title: title ?? 'OrbTap' });
    } else if (Platform.OS === 'ios') {
      await Share.share({ message: shareMessage, title: title ?? 'OrbTap' });
    } else {
      await Share.share({ message: shareMessage, url: link || undefined, title: title ?? 'OrbTap' });
    }
  } catch {
    // User dismissed or share not available
  }
}

/**
 * Build share payload for proof screen.
 */
export function proofSharePayload(partner: string, points: string, proofId: string, proofDeepLinkUrl: string): SharePayload {
  return {
    message: proofShareMessage(partner, points),
    url: proofDeepLinkUrl,
    title: 'OrbTap Proof',
  };
}

/**
 * Build share payload for user invite.
 */
export function userInviteSharePayload(inviteUrl: string, inviteMessage: string): SharePayload {
  return {
    message: inviteMessage,
    url: inviteUrl,
    title: 'Join me on OrbTap',
  };
}

/**
 * Build share payload for partner referral.
 */
export function partnerReferralSharePayload(referralUrl: string): SharePayload {
  return {
    message: `Apply for Featured or Sponsored placement on OrbTap — use my link for a bonus when you're approved:`,
    url: referralUrl,
    title: 'Partner with OrbTap',
  };
}

/**
 * Build share payload for "Share OrbTap" (app invite). Uses custom message and always includes app link
 * so recipients can open the app or get it from the store. Use prefs.shareMessage from settings.
 */
export function buildAppSharePayload(customMessage: string, title?: string): SharePayload {
  return {
    message: customMessage.trim() || DEFAULT_SHARE_MESSAGE,
    url: ORBTAP_APP_LINK,
    title: title ?? 'OrbTap',
  };
}

/**
 * Ensure every share payload has OrbTap app/website fallback in the shared message.
 * Use when building payloads so the link is always present even if caller omits url.
 */
export function ensureSharePayloadWithOrbTapLink(payload: SharePayload): SharePayload {
  const url = payload.url?.trim() || ORBTAP_APP_LINK;
  const msg = payload.message?.trim() || DEFAULT_SHARE_MESSAGE;
  return { ...payload, message: msg, url, title: payload.title ?? 'OrbTap' };
}

/** Contextual share message for bounty — includes OrbTap and link. */
export function bountySharePayload(message: string, bountyDeepLinkUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: message || 'Just discovered this deal on OrbTap — tap in to compete and win.',
    url: bountyDeepLinkUrl,
    title: 'OrbTap Bounty',
  });
}

/** Contextual share for feed post — OrbTap + post link. */
export function feedPostSharePayload(message: string, postDeepLinkUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: message || FEED_SHARE_HOOK,
    url: postDeepLinkUrl,
    title: 'OrbTap Feed',
  });
}

/** Contextual share for partner page — OrbTap + partner link. */
export function partnerPageSharePayload(partnerName: string, partnerDeepLinkUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: PARTNER_SHARE_HOOK(partnerName),
    url: partnerDeepLinkUrl,
    title: 'OrbTap Partner',
  });
}

/** Contextual share for sphere — OrbTap + join link. */
export function sphereSharePayload(sphereName: string, message: string, sphereUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: message || `Join ${sphereName} on OrbTap — tap orbs, earn together.`,
    url: sphereUrl,
    title: 'OrbTap Sphere',
  });
}

/** Contextual share for Orb Signal forecast. */
export function orbSignalSharePayload(message: string, forecastDeepLinkUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: message || 'Check out my Orb Signal prediction on OrbTap.',
    url: forecastDeepLinkUrl,
    title: 'OrbTap Signal',
  });
}

/** Contextual share for deal done card. */
export function dealDoneSharePayload(message: string, dealDeepLinkUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: message || 'We just did a deal on OrbTap — proof-backed and local.',
    url: dealDeepLinkUrl,
    title: 'OrbTap Deal',
  });
}

/** Contextual share for poll. */
export function pollSharePayload(question: string, pollUrl: string): SharePayload {
  return ensureSharePayloadWithOrbTapLink({
    message: question ? `Vote on this OrbTap poll: ${question}` : 'Vote on this poll on OrbTap — your voice matters.',
    url: pollUrl,
    title: 'OrbTap Poll',
  });
}
