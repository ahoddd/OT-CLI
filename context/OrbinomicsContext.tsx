import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type OrbinomicsConfig,
  DEFAULT_ORBINOMICS,
  ORBINOMICS_STORAGE_KEY,
  applyBurnRate,
  applyFeeRate,
  displayValue,
} from '../constants/Orbinomics';

interface OrbinomicsContextType {
  config: OrbinomicsConfig;
  setConfig: (config: OrbinomicsConfig) => void;
  resetConfig: () => void;
  applyBurnRate: (points: number) => number;
  applyFeeRate: (points: number) => { net: number; fee: number };
  displayValue: (points: number) => number;
  loading: boolean;
}

const OrbinomicsContext = createContext<OrbinomicsContextType | undefined>(undefined);

export function OrbinomicsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<OrbinomicsConfig>(() => ({ ...DEFAULT_ORBINOMICS }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ORBINOMICS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<OrbinomicsConfig>;
          setConfigState((prev) => ({
            ...DEFAULT_ORBINOMICS,
            ...prev,
            ...parsed,
            burnRateOnSpend: typeof parsed.burnRateOnSpend === 'number' ? parsed.burnRateOnSpend : prev.burnRateOnSpend,
            feeRateOnEarn: typeof parsed.feeRateOnEarn === 'number' ? parsed.feeRateOnEarn : prev.feeRateOnEarn,
            appreciationFactor: typeof parsed.appreciationFactor === 'number' ? parsed.appreciationFactor : prev.appreciationFactor,
            minPointsThreshold: typeof parsed.minPointsThreshold === 'number' ? parsed.minPointsThreshold : prev.minPointsThreshold,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('Orbinomics load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: OrbinomicsConfig) => {
    try {
      await AsyncStorage.setItem(ORBINOMICS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('Orbinomics persist error:', e);
    }
  }, []);

  const setConfig = useCallback(
    (next: OrbinomicsConfig) => {
      setConfigState(next);
      persist(next);
    },
    [persist]
  );

  const resetConfig = useCallback(() => {
    setConfigState({ ...DEFAULT_ORBINOMICS });
    persist(DEFAULT_ORBINOMICS);
  }, [persist]);

  const applyBurn = useCallback((points: number) => applyBurnRate(points, config), [config]);
  const applyFee = useCallback(
    (points: number) => applyFeeRate(points, config),
    [config]
  );
  const displayVal = useCallback((points: number) => displayValue(points, config), [config]);

  return (
    <OrbinomicsContext.Provider
      value={{
        config,
        setConfig,
        resetConfig,
        applyBurnRate: applyBurn,
        applyFeeRate: applyFee,
        displayValue: displayVal,
        loading,
      }}
    >
      {children}
    </OrbinomicsContext.Provider>
  );
}

export function useOrbinomics() {
  const ctx = useContext(OrbinomicsContext);
  if (!ctx) throw new Error('useOrbinomics must be used within OrbinomicsProvider');
  return ctx;
}
