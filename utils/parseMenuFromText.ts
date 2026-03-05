/**
 * Deterministic heuristic parser: raw OCR/manual text → sections + items.
 * No AI; section headers (ALL CAPS, no price), price patterns for items.
 * Preserves raw lines for audit.
 */

import type { MenuSection, MenuItem } from '../constants/PartnerMenu';
import { OCR_CONFIDENCE_THRESHOLD } from '../constants/PartnerMenu';

const SECTION_HEADER_PATTERNS = [
  /^APPETIZERS?$/i,
  /^SALADS?$/i,
  /^ENTR(E|É)ES?$/i,
  /^MAINS?$/i,
  /^SIDES?$/i,
  /^DRINKS?$/i,
  /^BEVERAGES?$/i,
  /^DESSERTS?$/i,
  /^KIDS?$/i,
  /^SPECIALS?$/i,
  /^SOUP(S)?$/i,
  /^BREAKFAST$/i,
  /^LUNCH$/i,
  /^DINNER$/i,
  /^BRUNCH$/i,
  /^SANDWICHES?$/i,
  /^BURGERS?$/i,
  /^PIZZA$/i,
  /^TACOS?$/i,
  /^WRAPS?$/i,
  /^COFFEE$/i,
  /^EXTRAS?$/i,
  /^ADD[- ]?ONS?$/i,
];

/** Price at end of line: $12.99, 12.99, 12, 12.00, 12/14 (sizes), 12 - 14 */
const PRICE_REGEX = /(\$?\s*(\d{1,4}(?:\.\d{2})?)(?:\s*[-\/]\s*(\d{1,4}(?:\.\d{2})?))?)\s*$/;

/** Line looks like a section header: short, often all caps, no price. */
function isLikelySectionHeader(line: string, nextLineHasPrice: boolean): boolean {
  const t = line.trim();
  if (t.length > 40) return false;
  if (PRICE_REGEX.test(t)) return false;
  if (SECTION_HEADER_PATTERNS.some((r) => r.test(t))) return true;
  if (t.length <= 25 && /^[A-Z\s\-&]+$/.test(t) && !nextLineHasPrice) return true;
  return false;
}

/** Extract price (cents) from end of line. Returns first price if range (e.g. 12/14 → 1200). */
function extractPriceCents(line: string): number | undefined {
  const m = line.match(PRICE_REGEX);
  if (!m) return undefined;
  const num = parseFloat(m[2].replace(/[^\d.]/g, ''));
  if (Number.isNaN(num)) return undefined;
  return Math.round(num * 100);
}

/** Strip price from end of line for item name. */
function stripPriceFromLine(line: string): string {
  return line.replace(PRICE_REGEX, '').trim();
}

/** Garbage: too many symbols, or mostly numbers. */
function garbageRatio(line: string): number {
  const t = line.trim();
  if (!t.length) return 1;
  const symbols = (t.match(/[^\w\s\.\-\$\,\'\"]/g) || []).length;
  const digits = (t.match(/\d/g) || []).length;
  return (symbols + Math.min(digits / 2, t.length / 2)) / t.length;
}

export interface ParseMenuResult {
  sections: MenuSection[];
  confidence: number;
  rawLines: string[];
}

function generateId(): string {
  return `mi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateSectionId(): string {
  return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Parse raw text (from OCR or manual paste) into sections and items.
 */
export function parseMenuFromRawText(rawText: string): ParseMenuResult {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const sections: MenuSection[] = [];
  let currentSection: MenuSection | null = null;
  let pendingDescription: string[] = [];
  let totalBlocks = 0;
  let recognizedBlocks = 0;
  let priceLikeLines = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const nextLine = rawLines[i + 1];
    const nextHasPrice = nextLine ? PRICE_REGEX.test(nextLine) : false;
    totalBlocks++;
    const garbage = garbageRatio(line);
    if (garbage < 0.4) recognizedBlocks++;
    if (PRICE_REGEX.test(line)) priceLikeLines++;

    if (isLikelySectionHeader(line, nextHasPrice)) {
      if (currentSection && pendingDescription.length > 0) {
        const last = currentSection.items[currentSection.items.length - 1];
        if (last) last.description = pendingDescription.join(' ').trim() || undefined;
        pendingDescription = [];
      }
      currentSection = {
        id: generateSectionId(),
        name: line,
        orderIndex: sections.length,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    const priceCents = extractPriceCents(line);
    if (priceCents !== undefined && currentSection) {
      if (currentSection.items.length > 0 && pendingDescription.length > 0) {
        const prev = currentSection.items[currentSection.items.length - 1];
        if (prev) prev.description = pendingDescription.join(' ').trim() || undefined;
      }
      pendingDescription = [];
      const name = stripPriceFromLine(line);
      if (name.length > 0) {
        currentSection.items.push({
          id: generateId(),
          name,
          priceCents,
          available: true,
          featuredTonight: false,
          dropSuggestionEnabled: false,
        });
      }
      continue;
    }

    if (currentSection && currentSection.items.length > 0) {
      const last = currentSection.items[currentSection.items.length - 1];
      if (last && !last.description) {
        last.description = line;
      } else if (last && last.description) {
        last.description = last.description + ' ' + line;
      } else {
        pendingDescription.push(line);
      }
    } else if (currentSection && line.length > 0) {
      pendingDescription.push(line);
    }
  }

  if (currentSection && pendingDescription.length > 0) {
    const last = currentSection.items[currentSection.items.length - 1];
    if (last) last.description = pendingDescription.join(' ').trim() || undefined;
  }

  const confidence =
    totalBlocks === 0
      ? 0
      : Math.min(
          1,
          (recognizedBlocks / totalBlocks) * 0.6 +
            (priceLikeLines / Math.max(1, totalBlocks)) * 0.3 +
            (sections.length > 0 ? 0.1 : 0)
        );

  return { sections, confidence, rawLines };
}

export function shouldUseCloudFallback(confidence: number, cloudFallbackEnabled: boolean): boolean {
  return confidence < OCR_CONFIDENCE_THRESHOLD && cloudFallbackEnabled;
}
