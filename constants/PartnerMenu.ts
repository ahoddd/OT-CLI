/**
 * Partner Menu OCR → Structured Menu → Publish.
 * Minimal models; persistence via MenuContext + AsyncStorage.
 */

export type MenuDocumentStatus = 'DRAFT' | 'PUBLISHED' | 'NEEDS_REVIEW';
export type MenuOcrEngine = 'ON_DEVICE' | 'CLOUD_FALLBACK' | 'MANUAL';
export type MenuReportType = 'WRONG_PRICE' | 'ITEM_MISSING' | 'ITEM_NOT_AVAILABLE' | 'OTHER';
export type MenuReportStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface MenuPhoto {
  storagePath: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceCents?: number;
  tags?: string[];
  available: boolean;
  featuredTonight: boolean;
  dropSuggestionEnabled: boolean;
  lastVerifiedAt?: number;
}

export interface MenuSection {
  id: string;
  name: string;
  orderIndex: number;
  items: MenuItem[];
}

export interface MenuVersionChangeLog {
  updatedByUid: string;
  summary: string;
  diffStats?: { sectionsChanged: number; itemsChanged: number; pricesChanged: number };
}

export interface MenuVersion {
  id: string;
  partnerId: string;
  menuId: string;
  source: {
    photos: MenuPhoto[];
    ocrEngine: MenuOcrEngine;
    confidence: number;
    rawLines?: string[];
  };
  sections: MenuSection[];
  changeLog: MenuVersionChangeLog;
  createdAt: number;
}

export interface MenuDocument {
  id: string;
  partnerId: string;
  locationId?: string;
  status: MenuDocumentStatus;
  verified: boolean;
  currentVersionId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MenuReport {
  id: string;
  partnerId: string;
  menuId: string;
  versionId: string;
  itemId?: string;
  reporterUid: string;
  type: MenuReportType;
  details: string;
  createdAt: number;
  status: MenuReportStatus;
}

export interface DropSuggestionDraft {
  id: string;
  partnerId: string;
  menuId: string;
  versionId: string;
  itemId: string;
  itemName: string;
  itemDescription?: string;
  priceCents?: number;
  createdAt: number;
}

export const PARTNER_MENUS_STORAGE_KEY = 'ORBTAP_PARTNER_MENUS_V1';
export const MENU_REPORTS_STORAGE_KEY = 'ORBTAP_MENU_REPORTS_V1';
export const DROP_SUGGESTION_DRAFTS_STORAGE_KEY = 'ORBTAP_DROP_SUGGESTION_DRAFTS_V1';

/** Default max photos per menu upload (v1). */
export const MENU_MAX_PHOTOS = 6;

/** Confidence threshold below which we could enable cloud fallback (feature-flagged). */
export const OCR_CONFIDENCE_THRESHOLD = 0.55;

/** Auto-flag NEEDS_REVIEW: min open reports in 14 days. */
export const NEEDS_REVIEW_OPEN_REPORTS_THRESHOLD = 3;
/** Auto-flag NEEDS_REVIEW: min wrong-price reports on same item. */
export const NEEDS_REVIEW_WRONG_PRICE_SAME_ITEM_THRESHOLD = 2;
export const NEEDS_REVIEW_DAYS_WINDOW = 14;
