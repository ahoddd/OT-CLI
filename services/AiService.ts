/**
 * OrbTap AI Service — pluggable API for:
 * - Signal tile image generation (EXPO_PUBLIC_AI_API_KEY + provider of your choice)
 * - Curated missions for users and spheres (personalized / circle-based)
 * Set EXPO_PUBLIC_AI_API_KEY in .env when ready; base URL optional for your model.
 */

const API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_KEY || '';
const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_BASE_URL || '';

export interface CuratedMission {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  partnerId?: string;
  type: 'visit' | 'scan' | 'streak' | 'collect';
}

export interface GenerateImageResult {
  url?: string;
  base64?: string;
  error?: string;
}

/** Generate or edit an image for an Orb Signal market (e.g. hero image for the tile). */
export async function generateSignalImage(
  prompt: string,
  marketId?: string
): Promise<GenerateImageResult> {
  if (!API_KEY) {
    return { error: 'No API key' };
  }
  if (AI_BASE_URL) {
    try {
      const res = await fetch(`${AI_BASE_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ prompt, marketId }),
      });
      const data = await res.json();
      return { url: data.url, base64: data.base64, error: data.error };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  return { error: 'Configure EXPO_PUBLIC_AI_BASE_URL for image generation' };
}

/** Curated missions for a user; optionally scoped to a sphere for circle-based challenges. */
export async function getCuratedMissions(options?: {
  userId?: string;
  sphereId?: string;
  limit?: number;
}): Promise<CuratedMission[]> {
  if (!API_KEY) {
    return [];
  }
  if (AI_BASE_URL) {
    try {
      const res = await fetch(
        `${AI_BASE_URL}/curated-missions?${new URLSearchParams({
          ...(options?.userId && { userId: options.userId }),
          ...(options?.sphereId && { sphereId: options.sphereId }),
          ...(options?.limit && { limit: String(options.limit) }),
        })}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const data = await res.json();
      return Array.isArray(data.missions) ? data.missions : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/** Legacy: generate missions by interests (kept for compatibility). */
export const AiService = {
  async generateMissions(userInterests: string[]) {
    const missions = await getCuratedMissions({ limit: 5 });
    if (missions.length > 0) return missions.map((m) => ({ title: m.title, desc: m.description }));
    return [
      { title: 'AI Generated: Coffee Run', desc: 'Based on your love for espresso.' },
    ];
  },
};
