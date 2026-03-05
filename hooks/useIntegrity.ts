/**
 * useIntegrity — client stub for IntegrityEvent recording.
 * Events stored locally; server should enforce rate limits and record server-side.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type IntegrityEvent,
  type IntegrityEventType,
  INTEGRITY_EVENTS_STORAGE_KEY,
  INTEGRITY_EVENTS_MAX,
} from '../constants/IntegrityEvent';

const UID_STUB = 'local'; // Replace with auth uid when wired.

export function useIntegrity() {
  const [events, setEvents] = useState<IntegrityEvent[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(INTEGRITY_EVENTS_STORAGE_KEY);
      const list: IntegrityEvent[] = raw ? JSON.parse(raw) : [];
      setEvents(Array.isArray(list) ? list : []);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recordEvent = useCallback(
    async (type: IntegrityEventType, meta?: Record<string, unknown>, partnerId?: string) => {
      const ev: IntegrityEvent = {
        id: `ie_${Date.now()}`,
        type,
        uid: UID_STUB,
        partnerId,
        meta,
        createdAt: Date.now(),
      };
      const next = [ev, ...events].slice(0, INTEGRITY_EVENTS_MAX);
      setEvents(next);
      try {
        await AsyncStorage.setItem(INTEGRITY_EVENTS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [events]
  );

  return { events, recordEvent, refresh: load };
}
