/**
 * Orbinomics — OT Points currency engine.
 * Configurable burn rates, fees, and appreciation so OT Points value can appreciate over time.
 * Admin hub can edit these; proof of concept for tokenomics-style value.
 */

export interface OrbinomicsConfig {
  /** Fraction of points burned when user spends (0–1). Higher = more scarcity. */
  burnRateOnSpend: number;
  /** Fraction of points taken as fee when user earns (0–1). Goes to treasury/burn. */
  feeRateOnEarn: number;
  /** Multiplier for "value" display (e.g. 1.0 = 1:1, 1.05 = 5% appreciation). */
  appreciationFactor: number;
  /** Minimum points required for certain actions (anti-dust). */
  minPointsThreshold: number;
  /** Label for admin display. */
  label?: string;
}

export const DEFAULT_ORBINOMICS: OrbinomicsConfig = {
  burnRateOnSpend: 0.02,
  feeRateOnEarn: 0.01,
  appreciationFactor: 1.0,
  minPointsThreshold: 10,
  label: 'Default',
};

export const ORBINOMICS_STORAGE_KEY = 'ORBTAP_ORBINOMICS_V1';

/** Compute points after burn (when user spends). */
export function applyBurnRate(points: number, config: OrbinomicsConfig): number {
  return Math.max(0, Math.floor(points * (1 - config.burnRateOnSpend)));
}

/** Compute points after fee (when user earns). */
export function applyFeeRate(points: number, config: OrbinomicsConfig): { net: number; fee: number } {
  const fee = Math.floor(points * config.feeRateOnEarn);
  return { net: points - fee, fee };
}

/** Display "value" with appreciation (for UI). */
export function displayValue(points: number, config: OrbinomicsConfig): number {
  return points * config.appreciationFactor;
}
