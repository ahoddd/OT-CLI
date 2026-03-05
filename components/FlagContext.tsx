import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_FLAGS,
  type FeatureFlags,
  type FlagKey,
  type FlagValue,
  type MapProvider,
} from '../constants/Flags';

const STORAGE_KEY = 'ORBTAP_FLAGS';
const AUDIT_KEY = 'ORBTAP_FLAGS_AUDIT';
const AUDIT_MAX = 20;

export interface AuditEntry {
  key: FlagKey;
  value: FlagValue;
  timestamp: number;
}

interface FlagContextType {
  flags: FeatureFlags;
  setFlag: (key: FlagKey, value: FlagValue) => void;
  resetFlags: () => void;
  auditLog: AuditEntry[];
}

const FlagContext = createContext<FlagContextType | undefined>(undefined);

const VALID_MAP_PROVIDERS: MapProvider[] = ['mapbox', 'native', 'none'];

function normalizeMapProvider(value: unknown): MapProvider {
  if (typeof value === 'string' && VALID_MAP_PROVIDERS.includes(value as MapProvider)) {
    return value as MapProvider;
  }
  return DEFAULT_FLAGS.mapProvider;
}

function mergeWithDefaults(parsed: Partial<FeatureFlags>): FeatureFlags {
  return {
    ...DEFAULT_FLAGS,
    ...parsed,
    mapProvider: normalizeMapProvider(parsed?.mapProvider),
  };
}

export const FlagProvider = ({ children }: { children: React.ReactNode }) => {
  const [flags, setFlagsState] = useState<FeatureFlags>(() => ({ ...DEFAULT_FLAGS }));
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [saved, savedAudit] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(AUDIT_KEY),
        ]);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<FeatureFlags>;
          setFlagsState(mergeWithDefaults(parsed));
        }
        if (savedAudit) {
          const list = JSON.parse(savedAudit) as AuditEntry[];
          setAuditLog(Array.isArray(list) ? list.slice(-AUDIT_MAX) : []);
        }
      } catch (e) {
        if (__DEV__) console.warn('FlagContext load error:', e);
      }
    })();
  }, []);

  const persist = useCallback(async (newFlags: FeatureFlags, newAudit: AuditEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags));
      await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(newAudit.slice(-AUDIT_MAX)));
    } catch (e) {
      if (__DEV__) console.warn('FlagContext persist error:', e);
    }
  }, []);

  const setFlag = useCallback(
    (key: FlagKey, value: FlagValue) => {
      setFlagsState((prev) => {
        const normalizedValue = key === 'mapProvider' ? normalizeMapProvider(value) : value;
        const next = { ...prev, [key]: normalizedValue };
        const entry: AuditEntry = { key, value, timestamp: Date.now() };
        setAuditLog((log) => {
          const nextLog = [...log, entry].slice(-AUDIT_MAX);
          persist(next, nextLog).catch(() => {});
          return nextLog;
        });
        return next;
      });
    },
    [persist]
  );

  const resetFlags = useCallback(() => {
    setFlagsState({ ...DEFAULT_FLAGS });
    setAuditLog([]);
    persist({ ...DEFAULT_FLAGS }, []).catch((e) => { if (__DEV__) console.warn('FlagContext reset persist:', e); });
  }, [persist]);

  return (
    <FlagContext.Provider value={{ flags, setFlag, resetFlags, auditLog }}>
      {children}
    </FlagContext.Provider>
  );
};

export const useFlags = (): FlagContextType => {
  const context = useContext(FlagContext);
  if (!context) throw new Error('useFlags must be used within FlagProvider');
  return context;
};

export type { MapProvider };
