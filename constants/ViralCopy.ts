/**
 * Viral & habit-forming copy — tuned for shareability, invites, and retention.
 * Single source for messages that drive growth and "addiction" (habit loops).
 */

// —— Invite & default share (curiosity + benefit + urgency) ——
export const USER_INVITE_MESSAGE = `I'm earning real rewards at local spots on OrbTap — you can too. We both get 50 OT when you join.`;
export const DEFAULT_SHARE_MESSAGE = `Real places, real rewards — I use OrbTap to earn points and redeem perks where I go. Try it:`;
export const ORBTAP_INVITE_HOOK = `Join me on OrbTap — tap orbs, earn points, redeem real perks.`;

// —— Proof share (social proof + FOMO) ——
export function proofShareMessage(partner: string, points: string): string {
  return `Just scored ${points} OT at ${partner} — verified on OrbTap. You can earn too.`;
}

// —— Tonight Recap (OrbSwipe) — share your night ——
export const TONIGHT_RECAP_TITLE = 'Tonight on OrbTap';
export const TONIGHT_RECAP_SHARE_HOOK = 'I built my night in 3 swipes — real stops, verified. You can too.';
export const TONIGHT_RECAP_SHARE_BUTTON = 'Share your night';

// —— Low supply (encouraging, not dead-end) ——
export const LOW_SUPPLY_HEADLINE = 'More picks a tap away';
export const LOW_SUPPLY_SUBLINE = 'Expand your radius or filters to see more — or hit the map.';

// —— OrbSwipe deck & Fuse (momentum) ——
export const ORBSWIPE_DECK_HINT = 'Swipe right = I\'m down · Left = Next · Up = Lock it in';
export const ORBSWIPE_FUSE_CTA = 'Fuse My Night';
export const ORBSWIPE_FUSE_SUBLINE = 'Turn your picks into one plan';
export const ORBSWIPE_FUSE_MODAL_TITLE = 'Your Night Plan';
export const ORBSWIPE_FUSE_MODAL_SUB = 'Your picks, fused into one plan — ordered and ready to go.';
export const ORBSWIPE_FUSE_CTA_START = 'Start My Night';
export const ORBSWIPE_TRAY_LABEL = 'Your picks';
export const ORBSWIPE_HUB_SUBLINE = 'Build your night in 3 swipes';

// —— OrbSwipe explanation (what it is, how it works) ——
export const ORBSWIPE_WHAT_IS = 'Build your night in swipes — add picks to your tray, then fuse a plan or just pick one.';
export const ORBSWIPE_SWIPE_RIGHT = 'Add to my night';
export const ORBSWIPE_SWIPE_LEFT = 'Next';
export const ORBSWIPE_SWIPE_UP = 'Reserve or do now';
export const ORBSWIPE_TRAY_EMPTY = 'Your night tray';
export const ORBSWIPE_TRAY_EMPTY_SUB = 'Swipe right to add picks · Tap any pick to go, or fuse a plan.';
export const ORBSWIPE_TRAY_RESET = 'Clear tray';
export const ORBSWIPE_TRAY_RESET_CONFIRM = 'Clear all picks from your tray?';

// Fuse modal — locked option teasers (show greyed out so users know what to unlock)
export const FUSE_TEASER_2STOP = 'Add one more pick to unlock';
export const FUSE_TEASER_BUDGET = 'Add a free or low-cost pick to unlock';
export const FUSE_TEASER_UPGRADE = 'Upgrade to Premium for more Fuse options';

// Empty deck — drive foot traffic when no cards left
export const ORBSWIPE_EMPTY_HEADLINE = "You're all caught up";
export const ORBSWIPE_EMPTY_SUB = 'Visit partners on the map or expand your radius to see more drops and missions here.';
export const ORBSWIPE_EMPTY_CTA_MAP = 'See partners on map';
export const ORBSWIPE_EMPTY_CTA_TUNE = 'Expand radius';
export const ORBSWIPE_EMPTY_CTA_DROPS = 'Browse drops';

// —— Fuse Never Fails — fallback states ——
export const FUSE_NO_PICKS_HEADLINE = 'No picks right now';
export const FUSE_NO_PICKS_SUB = "We looked around and couldn't find live drops or missions nearby. Try expanding your radius or checking back later.";
export const FUSE_RETRY_CTA = 'Retry with wider radius';
export const FUSE_SWITCH_CITY_CTA = 'Pick a city';
export const FUSE_MAP_PICKS_CTA = 'See top partners on map';
export const FUSE_SINGLE_ACTION_LABEL = 'Best pick nearby';

// —— Card Detail Sheet ——
export const CARD_DETAIL_WHY_PREFIX = "Why you're seeing this: ";
export const CARD_DETAIL_SAVE_LABEL = 'Save';
export const CARD_DETAIL_ADD_TRAY_LABEL = 'Add to tray';
export const CARD_DETAIL_MAP_LABEL = 'Show on map';

// —— SavedIntent ——
export const SAVED_INTENT_TOAST = 'Saved for later';
export const SAVED_INTENT_COMPLETED_TOAST = 'Nice! Saved intent completed';
export const SAVED_INTENT_MODULE_TITLE = 'Saved for tonight';
export const SAVED_INTENT_EMPTY = 'Swipe right on OrbSwipe to save picks here';

// —— FriendPass ——
export const FRIEND_PASS_OFFER_TITLE = 'Send a Friend Pass';
export const FRIEND_PASS_OFFER_SUB = 'Your friend gets a bonus when they complete a verified win at this partner.';
export const FRIEND_PASS_CTA = 'Create Friend Pass';
export const FRIEND_PASS_SHARE_MSG = (partner: string) => `I just won at ${partner} on OrbTap — here's a Friend Pass for you. Claim it and earn a bonus when you visit too!`;
export const FRIEND_PASS_CLAIMED_TOAST = 'Friend Pass claimed! Complete a verified win to earn your bonus.';
export const FRIEND_PASS_REWARD_TOAST = (points: number) => `Friend Pass bonus: +${points} OT Points`;

// —— Partner Growth Suggestions ——
export const GROWTH_SUGGESTIONS_TITLE = 'Growth Suggestions';
export const GROWTH_SUGGESTIONS_SUB = 'Based on your OrbSwipe performance this week';
export const GROWTH_TIP_OF_WEEK_TITLE = 'Tip of the week';

// —— Scan success & post-win (share prompt) ——
export const SCAN_SUCCESS_SHARE_HINT = 'Share your proof — friends will want in.';
export const PROOF_SHARE_CTA = 'Share proof';

// —— Onboarding (invite urgency) ——
export const ONBOARDING_INVITE_HINT = 'Invite friends — you both get 50 OT when they join. The more you bring, the more you earn.';

// —— Bounty / Feed / Partner (contextual) ——
export const BOUNTY_SHARE_HOOK = 'Just won this deal on OrbTap — proof-backed. Your turn.';
export const FEED_SHARE_HOOK = 'Saw this on OrbTap — real perks, real places.';
export const PARTNER_SHARE_HOOK = (name: string) => `Discover ${name} on OrbTap — earn points and redeem here.`;
