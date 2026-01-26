import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_PARTNERS } from '../constants/MockData';

const SOCIAL_KEY = 'ORBTAP_SOCIAL_V1';

export interface Circle {
  id: string;
  name: string;
  type: 'couple' | 'fami' | 'pal';
  members: string[]; // names
  totalPoints: number;
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
        setCircles(parsed.circles || []);
      } else {
        // Default Mock Circles for MVP
        setCircles([
          { id: 'c1', name: 'Power Couple', type: 'couple', members: ['You', 'Sarah'], totalPoints: 1250 },
          { id: 'c2', name: 'Gym Squad', type: 'pal', members: ['You', 'Mike', 'Jen'], totalPoints: 3400 },
        ]);
      }
    } catch (e) {
      console.error('Social load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSocial = async (newFollowing: string[], newCircles: Circle[]) => {
    try {
      await AsyncStorage.setItem(SOCIAL_KEY, JSON.stringify({ followingIds: newFollowing, circles: newCircles }));
    } catch (e) {
      console.error('Social save failed', e);
    }
  };

  const toggleFollow = (partnerId: string) => {
    let newFollowing;
    if (followingIds.includes(partnerId)) {
      newFollowing = followingIds.filter(id => id !== partnerId);
    } else {
      newFollowing = [...followingIds, partnerId];
    }
    setFollowingIds(newFollowing);
    saveSocial(newFollowing, circles);
  };

  const isFollowing = (partnerId: string) => followingIds.includes(partnerId);

  const getFollowedPartners = () => {
    return MOCK_PARTNERS.filter(p => followingIds.includes(p.id));
  };

  return { followingIds, circles, loading, toggleFollow, isFollowing, getFollowedPartners };
};
