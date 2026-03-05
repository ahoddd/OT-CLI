import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Partner } from '../constants/MockData';

const MAP_HISTORY_KEY = 'ORBTAP_MAP_HISTORY_V1';
const MAX_HISTORY = 5;

interface MapHistoryContextType {
  recentPartners: Partner[];
  addToHistory: (partner: Partner) => void;
  clearHistory: () => void;
}

const MapHistoryContext = createContext<MapHistoryContextType | undefined>(undefined);

export function MapHistoryProvider({ children }: { children: React.ReactNode }) {
  const [recentPartners, setRecentPartners] = useState<Partner[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MAP_HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partner[];
          setRecentPartners(Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : []);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = useCallback((list: Partner[]) => {
    AsyncStorage.setItem(MAP_HISTORY_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const addToHistory = useCallback(
    (partner: Partner) => {
      setRecentPartners((prev) => {
        const next = [partner, ...prev.filter((p) => p.id !== partner.id)].slice(0, MAX_HISTORY);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setRecentPartners([]);
    persist([]);
  }, [persist]);

  return (
    <MapHistoryContext.Provider value={{ recentPartners, addToHistory, clearHistory }}>
      {children}
    </MapHistoryContext.Provider>
  );
}

export function useMapHistory() {
  const ctx = useContext(MapHistoryContext);
  if (!ctx) throw new Error('useMapHistory must be used within MapHistoryProvider');
  return ctx;
}
