/**
 * Premium subscription pricing — admin-adjustable in Admin Hub.
 * Used by compare-accounts, premium page, and anywhere we show plan price.
 * Free (Silver) = $0; Premium (Gold) and Pro (Platinum) have configurable costs.
 */

export interface PremiumPricingConfig {
  /** User Premium (Gold) — monthly price in dollars. */
  userMonthlyDollars: number;
  /** User Premium — yearly price in dollars. */
  userYearlyDollars: number;
  /** User Pro (Platinum) — monthly price in dollars. */
  userProMonthlyDollars: number;
  /** User Pro — yearly price in dollars. */
  userProYearlyDollars: number;
  /** Partner Premium (Gold) — monthly price in dollars. */
  partnerMonthlyDollars: number;
  /** Partner Premium — yearly price in dollars. */
  partnerYearlyDollars: number;
  /** Partner Pro (Platinum) — monthly price in dollars. */
  partnerProMonthlyDollars: number;
  /** Partner Pro — yearly price in dollars. */
  partnerProYearlyDollars: number;
}

export const DEFAULT_PREMIUM_PRICING: PremiumPricingConfig = {
  userMonthlyDollars: 4.99,
  userYearlyDollars: 39.99,
  userProMonthlyDollars: 9.99,
  userProYearlyDollars: 79.99,
  partnerMonthlyDollars: 19.99,
  partnerYearlyDollars: 159.99,
  partnerProMonthlyDollars: 49.99,
  partnerProYearlyDollars: 399.99,
};

export const PREMIUM_PRICING_STORAGE_KEY = 'ORBTAP_PREMIUM_PRICING_V1';

export function formatPrice(dollars: number | undefined | null, period: 'month' | 'year'): string {
  const value = typeof dollars === 'number' && !Number.isNaN(dollars) ? dollars : 0;
  return `$${value.toFixed(2)}/${period === 'year' ? 'year' : 'mo'}`;
}

export function yearlySavingsPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0;
  const fullYearMonthly = monthly * 12;
  return Math.round((1 - yearly / fullYearMonthly) * 100);
}
