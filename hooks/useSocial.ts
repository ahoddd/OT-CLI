import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePartners } from '../context/PartnersContext';
import { useEffectiveTier } from './useEffectiveTier';
import { SPHERE_XP_PER_SOURCE } from '../constants/SphereLevels';

const MAX_CIRCLES: Record<'free' | 'premium' | 'pro', number> = { free: 2, premium: 10, pro: Infinity };
const MAX_FOLLOWS: Record<'free' | 'premium' | 'pro', number> = { free: 3, premium: Infinity, pro: Infinity };

const SOCIAL_KEY = 'ORBTAP_SOCIAL_V2';

export interface SpherePost {
  id: string;
  author: string;
  text?: string;
  imageUri?: string;
  at: number;
  /** Who liked (e.g. "You", member names). OrbTap-unique engagement. */
  likedBy?: string[];
  likeCount?: number;
}

export interface Circle {
  id: string;
  name: string;
  type: 'couple' | 'fami' | 'pal';
  members: string[];
  totalPoints: number;
  poolBalance: number;
  inviteCode: string;
  posts: SpherePost[];
  /** Sphere XP — levels from verified visits, OT earned, missions. Competitive for leaderboards. */
  sphereXp: number;
  /** Count of verified visits by any member (for display / group bonus logic). */
  verifiedVisitsCount: number;
  /** Missions completed by sphere members. */
  missionsCompletedCount: number;
  /** If false, sphere is hidden from profile and from "Spheres" count on profile. */
  isPublic: boolean;
  /** When we have public sphere profiles: show stats to non-members (default true). */
  showStatsPublic?: boolean;
  /** When we have public sphere profiles: show member list/count to non-members (default true). */
  showMembersPublic?: boolean;
  /** When we have public sphere profiles: show achievements to non-members (default true). */
  showAchievementsPublic?: boolean;
  /** Timestamp (ms) when the sphere was created. Shown on public profile as "Sphere established on ...". */
  createdAt?: number;
  /** Subscription tier of the sphere (from creator or majority of members). Free | Premium | Pro — drives 3-tier color/label. */
  sphereTier?: 'free' | 'premium' | 'pro';
}

const DEFAULT_CIRCLES: Circle[] = [
  {
    id: 'c1',
    name: 'Power Couple',
    type: 'couple',
    members: ['You', 'Sarah'],
    totalPoints: 1250,
    poolBalance: 200,
    inviteCode: 'PWR-001',
    posts: [
      { id: 'p1', author: 'Sarah', text: 'Great coffee run at Mountain Mug ☕', at: Date.now() - 86400000, likedBy: [], likeCount: 0 },
    ],
    sphereXp: 420,
    verifiedVisitsCount: 8,
    missionsCompletedCount: 4,
    isPublic: true,
    createdAt: Date.now() - 90 * 86400000,
    sphereTier: 'premium',
  },
  {
    id: 'c2',
    name: 'Gym Squad',
    type: 'pal',
    members: ['You', 'Mike', 'Jen'],
    totalPoints: 3400,
    poolBalance: 500,
    inviteCode: 'GYM-002',
    posts: [],
    sphereXp: 1100,
    verifiedVisitsCount: 22,
    missionsCompletedCount: 12,
    isPublic: true,
    createdAt: Date.now() - 60 * 86400000,
    sphereTier: 'free',
  },
];

function generateId() {
  return 'id_' + Math.random().toString(36).slice(2, 11);
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code.slice(0, 3) + '-' + code.slice(3);
}

export const useSocial = () => {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const { tier } = useEffectiveTier();

  useEffect(() => {
    loadSocial();
  }, []);

  const loadSocial = async () => {
    try {
      const data = await AsyncStorage.getItem(SOCIAL_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setFollowingIds(parsed.followingIds || []);
        const stored = parsed.circles || [];
        setCircles(stored.map((c: Circle) => ({
          ...c,
          poolBalance: c.poolBalance ?? 0,
          inviteCode: c.inviteCode || generateInviteCode(),
          posts: (c.posts || []).map((p: SpherePost) => ({
            ...p,
            likedBy: p.likedBy ?? [],
            likeCount: p.likeCount ?? (p.likedBy?.length ?? 0),
          })),
          sphereXp: c.sphereXp ?? 0,
          verifiedVisitsCount: c.verifiedVisitsCount ?? 0,
          missionsCompletedCount: c.missionsCompletedCount ?? 0,
          isPublic: c.isPublic !== false,
          showStatsPublic: c.showStatsPublic !== false,
          showMembersPublic: c.showMembersPublic !== false,
          showAchievementsPublic: c.showAchievementsPublic !== false,
          createdAt: typeof c.createdAt === 'number' ? c.createdAt : undefined,
          sphereTier: c.sphereTier === 'premium' || c.sphereTier === 'pro' ? c.sphereTier : 'free',
        })));
      } else {
        setCircles(DEFAULT_CIRCLES);
        saveSocial([], DEFAULT_CIRCLES);
      }
    } catch (e) {
      if (__DEV__) console.error('Social load failed', e);
      setCircles(DEFAULT_CIRCLES);
    } finally {
      setLoading(false);
    }
  };

  const saveSocial = useCallback(async (newFollowing: string[], newCircles: Circle[]) => {
    try {
      await AsyncStorage.setItem(SOCIAL_KEY, JSON.stringify({ followingIds: newFollowing, circles: newCircles }));
    } catch (e) {
      if (__DEV__) console.error('Social save failed', e);
    }
  }, []);

  const toggleFollow = (partnerId: string): { success: boolean; error?: 'limit_reached' } => {
    const isCurrentlyFollowing = followingIds.includes(partnerId);
    if (!isCurrentlyFollowing) {
      const limit = MAX_FOLLOWS[tier];
      if (followingIds.length >= limit) {
        return { success: false, error: 'limit_reached' };
      }
    }
    const newFollowing = isCurrentlyFollowing
      ? followingIds.filter(id => id !== partnerId)
      : [...followingIds, partnerId];
    setFollowingIds(newFollowing);
    saveSocial(newFollowing, circles);
    return { success: true };
  };

  const isFollowing = (partnerId: string) => followingIds.includes(partnerId);

  const { partners } = usePartners();
  const getFollowedPartners = () => partners.filter(p => followingIds.includes(p.id));

  const createCircle = (
    name: string,
    type: Circle['type'],
    creatorTier: 'free' | 'premium' | 'pro' = 'free',
  ): { success: true; circle: Circle } | { success: false; error: 'limit_reached'; limit: number } => {
    const limit = MAX_CIRCLES[tier];
    if (circles.length >= limit) {
      return { success: false, error: 'limit_reached', limit };
    }
    const newCircle: Circle = {
      id: generateId(),
      name,
      type,
      members: ['You'],
      totalPoints: 0,
      poolBalance: 0,
      inviteCode: generateInviteCode(),
      posts: [],
      sphereXp: 0,
      verifiedVisitsCount: 0,
      missionsCompletedCount: 0,
      isPublic: true,
      showStatsPublic: true,
      showMembersPublic: true,
      showAchievementsPublic: true,
      createdAt: Date.now(),
      sphereTier: creatorTier,
    };
    const newCircles = [...circles, newCircle];
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return { success: true, circle: newCircle };
  };

  const joinByCode = (code: string, memberName: string): Circle | null => {
    const normalized = code.replace(/\s/g, '').toUpperCase();
    const circle = circles.find(c => c.inviteCode.replace(/-/g, '') === normalized.replace(/-/g, ''));
    if (!circle || circle.members.includes(memberName)) return null;
    const newCircles = circles.map(c =>
      c.id === circle.id ? { ...c, members: [...c.members, memberName] } : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return newCircles.find(c => c.id === circle.id) ?? null;
  };

  const contributeToPool = (circleId: string, amount: number) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle || amount <= 0) return false;
    const xpFromContribute = Math.min(Math.floor(amount * 2), 200); // 2 XP per OT, cap 200 per contribution
    const newCircles = circles.map(c =>
      c.id === circleId
        ? { ...c, poolBalance: c.poolBalance + amount, sphereXp: (c.sphereXp ?? 0) + xpFromContribute }
        : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return true;
  };

  const addSphereXp = (circleId: string, source: 'verified_visit' | 'ot_earned' | 'mission_complete', amount?: number) => {
    const xp = amount ?? SPHERE_XP_PER_SOURCE[source];
    const newCircles = circles.map(c => {
      if (c.id !== circleId) return c;
      return {
        ...c,
        sphereXp: (c.sphereXp ?? 0) + xp,
        verifiedVisitsCount: source === 'verified_visit' ? (c.verifiedVisitsCount ?? 0) + 1 : (c.verifiedVisitsCount ?? 0),
        missionsCompletedCount: source === 'mission_complete' ? (c.missionsCompletedCount ?? 0) + 1 : (c.missionsCompletedCount ?? 0),
      };
    });
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
  };

  const addPost = (circleId: string, author: string, text?: string, imageUri?: string) => {
    const post: SpherePost = {
      id: generateId(),
      author,
      text: text?.trim() || undefined,
      imageUri,
      at: Date.now(),
      likedBy: [],
      likeCount: 0,
    };
    const newCircles = circles.map(c =>
      c.id === circleId ? { ...c, posts: [post, ...(c.posts || [])] } : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return post;
  };

  const togglePostLike = (circleId: string, postId: string, who: string) => {
    const newCircles = circles.map(c => {
      if (c.id !== circleId) return c;
      const posts = (c.posts || []).map(p => {
        if (p.id !== postId) return p;
        const likedBy = p.likedBy ?? [];
        const has = likedBy.includes(who);
        const next = has ? likedBy.filter(x => x !== who) : [...likedBy, who];
        return { ...p, likedBy: next, likeCount: next.length };
      });
      return { ...c, posts };
    });
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
  };

  const getCircle = (id: string) => circles.find(c => c.id === id);

  /** Find a circle by invite code (normalized: ignores spaces and dashes). For QR / join links. */
  const getCircleByInviteCode = (code: string): Circle | undefined => {
    const normalized = code.replace(/\s/g, '').replace(/-/g, '').toUpperCase();
    return circles.find(c => c.inviteCode.replace(/-/g, '') === normalized);
  };

  const getPublicCircles = () => circles.filter(c => c.isPublic !== false);

  const setSphereVisibility = (circleId: string, isPublic: boolean) => {
    const newCircles = circles.map(c =>
      c.id === circleId ? { ...c, isPublic } : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
  };

  /** Update a sphere's display name. */
  const updateCircleName = (circleId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newCircles = circles.map(c =>
      c.id === circleId ? { ...c, name: trimmed } : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return true;
  };

  /** Update what is shown on the sphere's public profile (stats, members, achievements). Default true. */
  const updateCirclePublicProfileVisibility = (
    circleId: string,
    opts: { showStatsPublic?: boolean; showMembersPublic?: boolean; showAchievementsPublic?: boolean }
  ) => {
    const newCircles = circles.map(c => {
      if (c.id !== circleId) return c;
      return {
        ...c,
        ...(opts.showStatsPublic !== undefined && { showStatsPublic: opts.showStatsPublic }),
        ...(opts.showMembersPublic !== undefined && { showMembersPublic: opts.showMembersPublic }),
        ...(opts.showAchievementsPublic !== undefined && { showAchievementsPublic: opts.showAchievementsPublic }),
      };
    });
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
  };

  /** Delete a sphere by id. Returns true if deleted. */
  const deleteCircle = (circleId: string) => {
    const newCircles = circles.filter(c => c.id !== circleId);
    if (newCircles.length === circles.length) return false;
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return true;
  };

  return {
    followingIds,
    circles,
    loading,
    toggleFollow,
    isFollowing,
    getFollowedPartners,
    createCircle,
    joinByCode,
    contributeToPool,
    addSphereXp,
    addPost,
    togglePostLike,
    getCircle,
    getCircleByInviteCode,
    getPublicCircles,
    setSphereVisibility,
    updateCircleName,
    updateCirclePublicProfileVisibility,
    deleteCircle,
    saveSocial,
  };
};
