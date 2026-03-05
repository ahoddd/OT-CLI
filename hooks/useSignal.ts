import { useState, useCallback, useEffect } from 'react';
import { getOrbSignalMarket, MOCK_ORB_SIGNAL_MARKETS, OrbSignalMarket, VOTE_COST } from '../constants/OrbSignal';
import { createForecast, listForecastsByUser, type OrbSignalForecast } from '../services/orbsignalForecasts';
import { useAuth } from '../context/AuthContext';

/** Hook for Orb Signal: get market by id, place forecast (persisted to Firestore), and list user's forecasts. */
export function useSignal() {
  const { user } = useAuth();
  const [myForecasts, setMyForecasts] = useState<OrbSignalForecast[]>([]);
  const [forecastsLoading, setForecastsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setMyForecasts([]);
      setForecastsLoading(false);
      return;
    }
    let cancelled = false;
    setForecastsLoading(true);
    listForecastsByUser(user.uid)
      .then((list) => {
        if (!cancelled) setMyForecasts(list);
      })
      .finally(() => {
        if (!cancelled) setForecastsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const getMarket = useCallback((id: string): OrbSignalMarket | undefined => {
    return getOrbSignalMarket(id);
  }, []);

  const placeForecast = useCallback(
    async (
      marketId: string,
      outcomeIndex: number,
      amount: number,
      marketQuestion?: string,
      outcomeLabel?: string
    ): Promise<boolean> => {
      if (!user?.uid) return false;
      const market = getOrbSignalMarket(marketId);
      const label = outcomeLabel ?? market?.outcomes?.[outcomeIndex] ?? 'Yes';
      try {
        const id = await createForecast(
          user.uid,
          marketId,
          outcomeIndex,
          label,
          amount,
          market?.question
        );
        setMyForecasts((prev) => [
          {
            id,
            userId: user.uid,
            marketId,
            outcomeIndex,
            outcomeLabel: label,
            amount,
            marketQuestion: market?.question,
            createdAt: Date.now(),
          },
          ...prev,
        ]);
        return true;
      } catch {
        return false;
      }
    },
    [user?.uid]
  );

  const getMyVoteForMarket = useCallback(
    (marketId: string): OrbSignalForecast | undefined => {
      return myForecasts.find((f) => f.marketId === marketId);
    },
    [myForecasts]
  );

  return {
    markets: MOCK_ORB_SIGNAL_MARKETS,
    getMarket,
    placeForecast,
    voteCost: VOTE_COST,
    myForecasts,
    forecastsLoading,
    getMyVoteForMarket,
  };
}
