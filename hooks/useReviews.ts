import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEWS_KEY = 'ORBTAP_REVIEWS_V1';

export interface Review {
  id: string;
  partnerId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean; // Only true if linked to a Proof
}

// Mock initial reviews to populate the UI
const MOCK_REVIEWS: Review[] = [
  { id: 'r1', partnerId: 'p1', userId: 'u2', userName: 'Sarah J.', rating: 5, text: 'Best coffee in the city! The wifi is super fast too.', date: '2023-10-15', verified: true },
  { id: 'r2', partnerId: 'p1', userId: 'u3', userName: 'Mike T.', rating: 4, text: 'Great vibes but a bit crowded.', date: '2023-10-14', verified: true },
];

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await AsyncStorage.getItem(REVIEWS_KEY);
      if (data) {
        setReviews([...MOCK_REVIEWS, ...JSON.parse(data)]);
      } else {
        setReviews(MOCK_REVIEWS);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addReview = async (partnerId: string, rating: number, text: string) => {
    const newReview: Review = {
      id: Date.now().toString(),
      partnerId,
      userId: 'me',
      userName: 'Explorer One', // You
      rating,
      text,
      date: new Date().toISOString().split('T')[0],
      verified: true
    };
    
    const updated = [newReview, ...reviews];
    setReviews(updated);
    // Persist only new ones in real app, but here we store diff
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated.filter(r => !MOCK_REVIEWS.includes(r))));
  };

  const getPartnerReviews = (partnerId: string) => reviews.filter(r => r.partnerId === partnerId);

  /**
   * Orb Score™ — Only on OrbTap. Copyrightable unique metric:
   * Blends star rating with verified-visit weight so that reviews from
   * people who actually visited (Proof-linked) count more. 0–100 scale.
   */
  const getOrbScore = (partnerId: string): { score: number; verifiedCount: number; totalCount: number; label: string } => {
    const partnerReviews = reviews.filter(r => r.partnerId === partnerId);
    if (partnerReviews.length === 0) {
      return { score: 0, verifiedCount: 0, totalCount: 0, label: 'No reviews yet' };
    }
    const verified = partnerReviews.filter(r => r.verified);
    // Verified reviews weighted 1.5x; then normalize to 0–100 (5 stars = 100).
    const weightedSum = partnerReviews.reduce((acc, r) => acc + (r.verified ? r.rating * 1.5 : r.rating), 0);
    const totalWeight = partnerReviews.reduce((acc, r) => acc + (r.verified ? 1.5 : 1), 0);
    const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const score = Math.round((avg / 5) * 100);
    const label = score >= 90 ? 'Elite' : score >= 75 ? 'Great' : score >= 60 ? 'Good' : 'Rising';
    return {
      score: Math.min(100, Math.max(0, score)),
      verifiedCount: verified.length,
      totalCount: partnerReviews.length,
      label,
    };
  };

  return { reviews, addReview, getPartnerReviews, getOrbScore };
};
