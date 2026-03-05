/**
 * Partner → Sphere invites: partners invite spheres to their business with an offer.
 * All through OrbTap (middle-man profit). Accept = pay or stake OT until QR scan at partner.
 */

/** Invite validity: day = 24h, week = 7d, month = 30d. Higher tiers unlock longer durations. */
export type SphereInviteDuration = 'day' | 'week' | 'month';

export interface SphereInvite {
  id: string;
  partnerId: string;
  partnerName: string;
  /** Target sphere by its invite code (e.g. PWR-001). So sphere members see it when their circle has this code. */
  sphereInviteCode: string;
  title: string;
  description: string;
  /** OT points required (0 = free offer; >0 = pay or stake until check-in). */
  otCost: number;
  createdAt: number;
  /** How long the offer is valid. Silver = day only; Gold = day/week; Platinum = day/week/month. */
  duration?: SphereInviteDuration;
  /** When this invite expires (ms). Derived from duration + createdAt. */
  expiresAt?: number;
  /** When a member accepts: who and when. */
  acceptedBy?: string;
  acceptedAt?: number;
  /** Staked amount (released when user scans QR at partner). */
  stakedAmount?: number;
  /** When stake was released (QR scanned at partner). */
  clearedAt?: number;
  status: 'pending' | 'accepted' | 'denied';
}

const STORAGE_KEY = 'ORBTAP_SPHERE_INVITES_V1';

export async function loadSphereInvites(): Promise<SphereInvite[]> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSphereInvites(invites: SphereInvite[]): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(invites));
}

export function generateSphereInviteId(): string {
  return 'inv_' + Math.random().toString(36).slice(2, 12);
}
