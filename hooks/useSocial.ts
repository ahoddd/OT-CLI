import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_PARTNERS } from '../constants/MockData';
import { SPHERE_XP_PER_SOURCE } from '../constants/SphereLevels';

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
        })));
      } else {
        setCircles(DEFAULT_CIRCLES);
        saveSocial([], DEFAULT_CIRCLES);
      }
    } catch (e) {
      console.error('Social load failed', e);
      setCircles(DEFAULT_CIRCLES);
    } finally {
      setLoading(false);
    }
  };

  const saveSocial = useCallback(async (newFollowing: string[], newCircles: Circle[]) => {
    try {
      await AsyncStorage.setItem(SOCIAL_KEY, JSON.stringify({ followingIds: newFollowing, circles: newCircles }));
    } catch (e) {
      console.error('Social save failed', e);
    }
  }, []);

  const toggleFollow = (partnerId: string) => {
    const newFollowing = followingIds.includes(partnerId)
      ? followingIds.filter(id => id !== partnerId)
      : [...followingIds, partnerId];
    setFollowingIds(newFollowing);
    saveSocial(newFollowing, circles);
  };

  const isFollowing = (partnerId: string) => followingIds.includes(partnerId);

  const getFollowedPartners = () => MOCK_PARTNERS.filter(p => followingIds.includes(p.id));

  const createCircle = (name: string, type: Circle['type']) => {
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
    };
    const newCircles = [...circles, newCircle];
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
    return newCircle;
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

  const getPublicCircles = () => circles.filter(c => c.isPublic !== false);

  const setSphereVisibility = (circleId: string, isPublic: boolean) => {
    const newCircles = circles.map(c =>
      c.id === circleId ? { ...c, isPublic } : c
    );
    setCircles(newCircles);
    saveSocial(followingIds, newCircles);
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
    getPublicCircles,
    setSphereVisibility,
    saveSocial,
  };
};
