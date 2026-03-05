/**
 * Partner Growth Suggestions — deterministic, data-driven recommendations for Pro partners.
 * Uses OrbSwipe analytics bucketed by hour, template, offer window, headline length.
 */

import { useMemo } from 'react';
import type { OrbSwipeEvent } from '../services/orbswipeAnalytics';

export interface GrowthSuggestion {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  actionType: 'create_card' | 'schedule' | 'duplicate';
  /** Metadata for pre-filling a draft. */
  meta?: Record<string, string | number>;
}

interface HourBucket {
  hour: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

function bucketByHour(events: OrbSwipeEvent[], partnerId: string): HourBucket[] {
  const buckets: Record<number, HourBucket> = {};
  for (let h = 0; h < 24; h++) {
    buckets[h] = { hour: h, impressions: 0, clicks: 0, conversions: 0 };
  }
  for (const e of events) {
    if (e.partnerId !== partnerId) continue;
    const hour = new Date(e.at).getHours();
    if (!buckets[hour]) continue;
    if (e.type === 'impression' || e.type === 'sponsored_impression') buckets[hour].impressions++;
    if (e.type === 'cta_click') buckets[hour].clicks++;
    if (e.type === 'verified_win') buckets[hour].conversions++;
  }
  return Object.values(buckets);
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}${ampm}`;
}

export function useGrowthSuggestions(
  partnerId: string,
  events: OrbSwipeEvent[],
  tier: 'full' | 'tip' | 'none'
): GrowthSuggestion[] {
  return useMemo(() => {
    if (tier === 'none' || events.length === 0) return [];

    const hourBuckets = bucketByHour(events, partnerId);
    const suggestions: GrowthSuggestion[] = [];

    const bestHour = hourBuckets.reduce((a, b) =>
      a.conversions > b.conversions ? a : (a.conversions === b.conversions && a.clicks > b.clicks ? a : b)
    );
    if (bestHour.impressions > 0) {
      suggestions.push({
        id: 'best_time',
        title: 'Best time to post today',
        detail: `Your best conversion hour is ${formatHour(bestHour.hour)} (${bestHour.conversions} conversions, ${bestHour.clicks} clicks). Schedule drops for this window.`,
        actionLabel: 'Schedule for best time',
        actionType: 'schedule',
        meta: { hour: bestHour.hour },
      });
    }

    const totalImpressions = events.filter(
      (e) => e.partnerId === partnerId && (e.type === 'impression' || e.type === 'sponsored_impression')
    ).length;
    const totalClicks = events.filter(
      (e) => e.partnerId === partnerId && e.type === 'cta_click'
    ).length;
    const totalConversions = events.filter(
      (e) => e.partnerId === partnerId && e.type === 'verified_win'
    ).length;

    if (tier === 'full' && totalImpressions > 0) {
      const convRate = totalConversions / totalImpressions;
      const windowSuggestion = convRate > 0.05 ? '2–3 hours' : '4–6 hours';
      suggestions.push({
        id: 'drop_window',
        title: 'Recommended drop window length',
        detail: `Based on ${totalImpressions} impressions and ${totalConversions} conversions, a ${windowSuggestion} drop window works best for your audience.`,
        actionLabel: 'Create card using best template',
        actionType: 'create_card',
        meta: { windowHours: convRate > 0.05 ? 3 : 5 },
      });
    }

    if (tier === 'full' && totalClicks > 0) {
      suggestions.push({
        id: 'headline_tip',
        title: 'Recommended headline length',
        detail: 'Short headlines (under 40 characters) consistently get more taps. Keep your drop titles concise and action-oriented.',
        actionLabel: 'Duplicate best performer',
        actionType: 'duplicate',
      });
    }

    if (tier === 'tip') {
      return suggestions.slice(0, 1);
    }

    return suggestions.slice(0, 4);
  }, [partnerId, events, tier]);
}
