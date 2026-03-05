/**
 * SavedIntent — lightweight intent objects created by right-swipes in OrbSwipe.
 * Surfaces in Tonight/Home, Spheres Plans, and Wallet.
 */

export type SavedIntentKind = 'DROP' | 'PARTNER' | 'MISSION' | 'MENU_ITEM' | 'MEAL_PROPOSAL';
export type SavedIntentStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';

export interface SavedIntent {
  id: string;
  uid: string;
  kind: SavedIntentKind;
  refId: string;
  createdAt: number;
  expiresAt?: number;
  context: {
    source: 'ORBSWIPE';
    tags?: string[];
  };
  status: SavedIntentStatus;
  /** Cached display data so modules don't need to re-fetch. */
  displayName?: string;
  displaySub?: string;
  partnerId?: string;
  tier?: string;
}
