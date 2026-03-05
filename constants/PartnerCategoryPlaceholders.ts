/**
 * One generic placeholder image per partner category for use when a partner
 * has not uploaded their own photo. Used on partner tiles, modals, and detail.
 * All URLs are high-quality, category-appropriate, and license-friendly (Unsplash).
 */

export const PARTNER_CATEGORY_PLACEHOLDERS: Record<string, string> = {
  Dining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
  Nightlife: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
  Services: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
  Hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
  Retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
  Cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  Entertainment: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600',
};

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600';

/**
 * Returns the placeholder image URL for a partner category.
 * Falls back to a generic business image if category is unknown.
 */
export function getCategoryPlaceholderImage(category: string): string {
  return PARTNER_CATEGORY_PLACEHOLDERS[category] ?? DEFAULT_PLACEHOLDER;
}

/**
 * Best image to show for a partner: their upload, then logo, then category placeholder.
 */
export function getPartnerHeroImage(partner: {
  featuredImageUrl?: string | null;
  logoUrl?: string | null;
  category: string;
}): string {
  if (partner.featuredImageUrl) return partner.featuredImageUrl;
  if (partner.logoUrl) return partner.logoUrl;
  return getCategoryPlaceholderImage(partner.category);
}
