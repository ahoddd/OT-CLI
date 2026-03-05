/**
 * Stamp Cards™ — category and template to stamp icons (Ionicons).
 * Used so each stamp slot shows a business-relevant icon (coffee, restaurant, bag, etc.).
 */

import type { StampTemplate } from './StampCards';

/** Ionicons name for filled vs empty stamp slot per template. */
export const STAMP_TEMPLATE_ICONS: Record<StampTemplate, { filled: string; empty: string }> = {
  COFFEE: { filled: 'cafe', empty: 'cafe-outline' },
  RESTAURANT: { filled: 'restaurant', empty: 'restaurant-outline' },
  RETAIL: { filled: 'bag', empty: 'bag-outline' },
  SERVICE: { filled: 'construct', empty: 'construct-outline' },
  EVENT: { filled: 'calendar', empty: 'calendar-outline' },
};

/** Partner category (e.g. from Partner.category) → default StampTemplate for new programs. */
export const PARTNER_CATEGORY_TO_STAMP_TEMPLATE: Record<string, StampTemplate> = {
  Cafe: 'COFFEE',
  Coffee: 'COFFEE',
  Dining: 'RESTAURANT',
  Nightlife: 'RESTAURANT',
  Restaurant: 'RESTAURANT',
  Food: 'RESTAURANT',
  Retail: 'RETAIL',
  Services: 'SERVICE',
  Service: 'SERVICE',
  Hospitality: 'EVENT',
  Entertainment: 'EVENT',
  Event: 'EVENT',
  Platform: 'RETAIL',
};

const DEFAULT_TEMPLATE: StampTemplate = 'COFFEE';

/** Resolve partner category to StampTemplate for default in Stamp Studio. */
export function getStampTemplateForCategory(category: string | undefined): StampTemplate {
  if (!category) return DEFAULT_TEMPLATE;
  return PARTNER_CATEGORY_TO_STAMP_TEMPLATE[category] ?? DEFAULT_TEMPLATE;
}

/** Get Ionicons names for a template (filled and empty). */
export function getStampIconsForTemplate(template: StampTemplate | undefined): { filled: string; empty: string } {
  if (!template || !(template in STAMP_TEMPLATE_ICONS)) {
    return { filled: 'checkmark-circle', empty: 'ellipse-outline' };
  }
  return STAMP_TEMPLATE_ICONS[template as StampTemplate];
}
