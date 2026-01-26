import { useState } from 'react';

export interface Market {
  id: string;
  question: string;
  outcomes: string[];
  pool: number; // Total points
  endsAt: string;
  category: 'Pop Culture' | 'City' | 'Sports';
  percentages: number[]; // e.g. [60, 40]
}

const MOCK_MARKETS: Market[] = [
  {
    id: 'm1',
    question: 'Will it rain in NYC this weekend?',
    outcomes: ['Yes', 'No'],
    pool: 45000,
    endsAt: 'Friday 5PM',
    category: 'City',
    percentages: [30, 70]
  },
  {
    id: 'm2',
    question: 'Who headlines the Downtown Festival?',
    outcomes: ['The Weeknd', 'Dua Lipa'],
    pool: 120000,
    endsAt: 'Sunday 12PM',
    category: 'Pop Culture',
    percentages: [55, 45]
  }
];

export const useSignal = () => {
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);

  const getMarket = (id: string) => markets.find(m => m.id === id);

  const placeForecast = (marketId: string, outcomeIndex: number, amount: number) => {
    // Mock logic: just alert for MVP
    console.log(`Forecast placed: Market ${marketId}, Outcome ${outcomeIndex}, Amount ${amount}`);
    return true;
  };

  return { markets, getMarket, placeForecast };
};
