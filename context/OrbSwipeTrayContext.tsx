/**
 * OrbSwipeTrayContext — shared tray for cards saved from the inline Discovery Hub swipe tab.
 * Used by InlineOrbSwipe and the "Saved" screen so the pill navigates to a page that shows the same cards.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';

const MAX_TRAY = 8;

interface OrbSwipeTrayContextType {
  trayCards: OrbSwipeCard[];
  addToTray: (card: OrbSwipeCard) => void;
  removeFromTray: (cardId: string) => void;
  setTrayCards: (cards: OrbSwipeCard[] | ((prev: OrbSwipeCard[]) => OrbSwipeCard[])) => void;
  clearTray: () => void;
  isInTray: (cardId: string) => boolean;
  trayCount: number;
}

const OrbSwipeTrayContext = createContext<OrbSwipeTrayContextType | undefined>(undefined);

export function OrbSwipeTrayProvider({ children }: { children: React.ReactNode }) {
  const [trayCards, setTrayCardsState] = useState<OrbSwipeCard[]>([]);

  const addToTray = useCallback((card: OrbSwipeCard) => {
    setTrayCardsState((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      if (prev.length >= MAX_TRAY) return prev;
      return [...prev, card];
    });
  }, []);

  const removeFromTray = useCallback((cardId: string) => {
    setTrayCardsState((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const setTrayCards = useCallback((arg: OrbSwipeCard[] | ((prev: OrbSwipeCard[]) => OrbSwipeCard[])) => {
    setTrayCardsState(typeof arg === 'function' ? arg : () => arg);
  }, []);

  const clearTray = useCallback(() => {
    setTrayCardsState([]);
  }, []);

  const isInTray = useCallback(
    (cardId: string) => trayCards.some((c) => c.id === cardId),
    [trayCards]
  );

  const value: OrbSwipeTrayContextType = {
    trayCards,
    addToTray,
    removeFromTray,
    setTrayCards,
    clearTray,
    isInTray,
    trayCount: trayCards.length,
  };

  return (
    <OrbSwipeTrayContext.Provider value={value}>
      {children}
    </OrbSwipeTrayContext.Provider>
  );
}

export function useOrbSwipeTray() {
  const ctx = useContext(OrbSwipeTrayContext);
  if (ctx === undefined) {
    throw new Error('useOrbSwipeTray must be used within OrbSwipeTrayProvider');
  }
  return ctx;
}
