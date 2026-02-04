/**
 * OrbTap Knowledge Service — Fun facts + motivational quotes.
 * Tries free APIs first (quotable.io, uselessfacts); fallback to curated list.
 * When EXPO_PUBLIC_KNOWLEDGE_AI_KEY (or AI key) is set, can switch to AI-generated content.
 */

import type { KnowledgeItem } from '../constants/KnowledgeBase';
import { CURATED_KNOWLEDGE } from '../constants/KnowledgeBase';

const QUOTABLE_URL = 'https://api.quotable.io/random';
const USELESS_FACTS_URL = 'https://uselessfacts.jsph.pl/api/v2/facts/random';
const FETCH_TIMEOUT_MS = 5000;

/** When set, future versions can call your AI for personalized facts/quotes */
export const KNOWLEDGE_AI_KEY = process.env.EXPO_PUBLIC_KNOWLEDGE_AI_KEY || process.env.EXPO_PUBLIC_AI_API_KEY || '';

function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function fetchRandomQuote(): Promise<KnowledgeItem | null> {
  try {
    const res = await timeoutPromise(fetch(QUOTABLE_URL), FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.content;
    const author = data?.author;
    if (!content || typeof content !== 'string') return null;
    return {
      id: `quotable-${data?._id || Date.now()}`,
      type: 'quote',
      text: content,
      author: author || undefined,
      source: 'Quotable',
    };
  } catch {
    return null;
  }
}

async function fetchRandomFact(): Promise<KnowledgeItem | null> {
  try {
    const res = await timeoutPromise(fetch(USELESS_FACTS_URL), FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.text;
    if (!text || typeof text !== 'string') return null;
    return {
      id: `useless-${data?.id || Date.now()}`,
      type: 'fact',
      text,
      source: 'Useless Facts',
    };
  } catch {
    return null;
  }
}

/** Get one random item: 50% quote from API, 50% fact from API; fallback to curated. */
export async function fetchNextKnowledgeItem(): Promise<KnowledgeItem> {
  const useQuote = Math.random() < 0.5;
  if (useQuote) {
    const quote = await fetchRandomQuote();
    if (quote) return quote;
  } else {
    const fact = await fetchRandomFact();
    if (fact) return fact;
  }
  // Fallback: try the other API
  const other = useQuote ? await fetchRandomFact() : await fetchRandomQuote();
  if (other) return other;
  // Curated fallback
  const idx = Math.floor(Math.random() * CURATED_KNOWLEDGE.length);
  return CURATED_KNOWLEDGE[idx];
}

/** Get a random item from curated only (offline / deterministic). */
export function getRandomCuratedItem(): KnowledgeItem {
  const idx = Math.floor(Math.random() * CURATED_KNOWLEDGE.length);
  return CURATED_KNOWLEDGE[idx];
}

/** For AI integration: when KNOWLEDGE_AI_KEY is set, call your backend to get personalized fact/quote. */
export async function fetchKnowledgeFromAI(_prompt?: string): Promise<KnowledgeItem | null> {
  if (!KNOWLEDGE_AI_KEY) return null;
  // Placeholder: your backend endpoint that returns { id, type, text, author?, funFact? }
  // try {
  //   const res = await fetch(YOUR_AI_KNOWLEDGE_URL, { ... });
  //   const data = await res.json();
  //   return data as KnowledgeItem;
  // } catch { return null; }
  return null;
}
