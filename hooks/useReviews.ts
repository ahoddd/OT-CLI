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

  return { reviews, addReview, getPartnerReviews };
};
