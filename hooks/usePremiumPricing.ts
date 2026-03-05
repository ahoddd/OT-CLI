/**
 * Premium pricing — admin-adjustable; app reads for compare/premium screens.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type PremiumPricingConfig,
  DEFAULT_PREMIUM_PRICING,
  PREMIUM_PRICING_STORAGE_KEY,
} from '../constants/PremiumPricing';

export function usePremiumPricing() {
  const [config, setConfig] = useState<PremiumPricingConfig>(DEFAULT_PREMIUM_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREMIUM_PRICING_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PremiumPricingConfig>;
          setConfig({
            ...DEFAULT_PREMIUM_PRICING,
            userMonthlyDollars: typeof parsed.userMonthlyDollars === 'number' ? parsed.userMonthlyDollars : DEFAULT_PREMIUM_PRICING.userMonthlyDollars,
            userYearlyDollars: typeof parsed.userYearlyDollars === 'number' ? parsed.userYearlyDollars : DEFAULT_PREMIUM_PRICING.userYearlyDollars,
            userProMonthlyDollars: typeof parsed.userProMonthlyDollars === 'number' ? parsed.userProMonthlyDollars : DEFAULT_PREMIUM_PRICING.userProMonthlyDollars,
            userProYearlyDollars: typeof parsed.userProYearlyDollars === 'number' ? parsed.userProYearlyDollars : DEFAULT_PREMIUM_PRICING.userProYearlyDollars,
            partnerMonthlyDollars: typeof parsed.partnerMonthlyDollars === 'number' ? parsed.partnerMonthlyDollars : DEFAULT_PREMIUM_PRICING.partnerMonthlyDollars,
            partnerYearlyDollars: typeof parsed.partnerYearlyDollars === 'number' ? parsed.partnerYearlyDollars : DEFAULT_PREMIUM_PRICING.partnerYearlyDollars,
            partnerProMonthlyDollars: typeof parsed.partnerProMonthlyDollars === 'number' ? parsed.partnerProMonthlyDollars : DEFAULT_PREMIUM_PRICING.partnerProMonthlyDollars,
            partnerProYearlyDollars: typeof parsed.partnerProYearlyDollars === 'number' ? parsed.partnerProYearlyDollars : DEFAULT_PREMIUM_PRICING.partnerProYearlyDollars,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveConfig = useCallback(async (next: PremiumPricingConfig) => {
    setConfig(next);
    try {
      await AsyncStorage.setItem(PREMIUM_PRICING_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('Premium pricing save error:', e);
    }
  }, []);

  return { config, loading, saveConfig };
}
