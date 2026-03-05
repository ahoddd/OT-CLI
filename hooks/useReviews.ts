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
  /** Proof/VerifiedAction id for stamp-gated verified reviews. */
  proofId?: string;
  /** Partner reply (owner only). */
  partnerReply?: string;
  partnerReplyAt?: string;
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
      const byId = new Map<string, Review>();
      MOCK_REVIEWS.forEach((r) => byId.set(r.id, r));
      if (data) {
        const stored: Review[] = JSON.parse(data);
        stored.forEach((r) => byId.set(r.id, r));
      }
      setReviews(Array.from(byId.values()));
    } catch (e) {
      if (__DEV__) console.error(e);
    }
  };

  const addReview = async (partnerId: string, rating: number, text: string, proofId?: string) => {
    const newReview: Review = {
      id: Date.now().toString(),
      partnerId,
      userId: 'me',
      userName: 'Explorer One', // You
      rating,
      text,
      date: new Date().toISOString().split('T')[0],
      verified: true,
      proofId,
    };
    
    const updated = [newReview, ...reviews];
    setReviews(updated);
    // Persist only new ones in real app, but here we store diff
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated.filter(r => !MOCK_REVIEWS.includes(r))));
    const { recordPartnerReview } = await import('../services/partnerAnalytics');
    recordPartnerReview(partnerId).catch(() => {});
  };

  const getPartnerReviews = (partnerId: string) => reviews.filter(r => r.partnerId === partnerId);

  const addPartnerReply = async (reviewId: string, partnerId: string, replyText: string) => {
    const updated = reviews.map((r) =>
      r.id === reviewId && r.partnerId === partnerId
        ? { ...r, partnerReply: replyText.trim(), partnerReplyAt: new Date().toISOString().split('T')[0] }
        : r
    );
    setReviews(updated);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  };

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
    const label = score >= 90 ? 'Legendary' : score >= 75 ? 'Great' : score >= 60 ? 'Good' : 'Rising';
    return {
      score: Math.min(100, Math.max(0, score)),
      verifiedCount: verified.length,
      totalCount: partnerReviews.length,
      label,
    };
  };

  return { reviews, addReview, addPartnerReply, getPartnerReviews, getOrbScore };
};
