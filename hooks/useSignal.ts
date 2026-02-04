import { useState, useCallback } from 'react';
import { getOrbSignalMarket, MOCK_ORB_SIGNAL_MARKETS, OrbSignalMarket, VOTE_COST } from '../constants/OrbSignal';

/** Hook for Orb Signal: get market by id and place forecast (mock). List page uses constants directly for local state. */
export function useSignal() {
  const [votes, setVotes] = useState<Record<string, number>>({}); // marketId -> outcomeIndex

  const getMarket = useCallback((id: string): OrbSignalMarket | undefined => {
    return getOrbSignalMarket(id);
  }, []);

  const placeForecast = useCallback((marketId: string, outcomeIndex: number, amount: number) => {
    setVotes((prev) => ({ ...prev, [marketId]: outcomeIndex }));
    return true;
  }, []);

  return {
    markets: MOCK_ORB_SIGNAL_MARKETS,
    getMarket,
    placeForecast,
    voteCost: VOTE_COST,
  };
}
