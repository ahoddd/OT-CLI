import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = '@orbtap_search_history_v1';
const MAX_HISTORY = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => raw ? setHistory(JSON.parse(raw)) : null)
      .catch(() => {});
  }, []);

  const persist = useCallback((next: string[]) => {
    setHistory(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const addToHistory = useCallback((query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setHistory(prev => {
      const deduped = [q, ...prev.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deduped)).catch(() => {});
      return deduped;
    });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== query);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => persist([]), [persist]);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
