import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type UIConfig,
  type UIConfigAuditEntry,
  DEFAULT_UICONFIG,
  UICONFIG_STORAGE_KEY,
  UICONFIG_AUDIT_KEY,
  UICONFIG_AUDIT_MAX,
  mergeUIConfigWithDefaults,
  normalizeUIVersion,
  type UIVersion,
} from '../constants/UIConfig';

export type SetUiVersionResult = { success: boolean; error?: string };

interface UIConfigContextType {
  config: UIConfig;
  uiVersion: UIVersion;
  /** Saves UI version and persists; returns success/error. Use for Admin Hub Save button. */
  setUiVersion: (version: UIVersion) => Promise<SetUiVersionResult>;
  auditLog: UIConfigAuditEntry[];
}

const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);

export const UIConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfigState] = useState<UIConfig>(() => ({ ...DEFAULT_UICONFIG }));
  const [auditLog, setAuditLog] = useState<UIConfigAuditEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [saved, savedAudit] = await Promise.all([
          AsyncStorage.getItem(UICONFIG_STORAGE_KEY),
          AsyncStorage.getItem(UICONFIG_AUDIT_KEY),
        ]);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as Partial<UIConfig> | null;
            setConfigState(mergeUIConfigWithDefaults(parsed));
          } catch {
            setConfigState({ ...DEFAULT_UICONFIG });
          }
        }
        if (savedAudit) {
          try {
            const list = JSON.parse(savedAudit) as UIConfigAuditEntry[];
            setAuditLog(Array.isArray(list) ? list.slice(-UICONFIG_AUDIT_MAX) : []);
          } catch {
            setAuditLog([]);
          }
        }
      } catch (e) {
        if (__DEV__) console.warn('UIConfigContext load error:', e);
        setConfigState({ ...DEFAULT_UICONFIG });
      }
    })();
  }, []);

  const persist = useCallback(async (newConfig: UIConfig, newAudit: UIConfigAuditEntry[]): Promise<void> => {
    await AsyncStorage.setItem(UICONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    await AsyncStorage.setItem(UICONFIG_AUDIT_KEY, JSON.stringify(newAudit.slice(-UICONFIG_AUDIT_MAX)));
  }, []);

  const setUiVersion = useCallback(
    (version: UIVersion): Promise<SetUiVersionResult> => {
      const normalized = normalizeUIVersion(version);
      const entry: UIConfigAuditEntry = { uiVersion: normalized, timestamp: Date.now() };
      const nextConfig = { ...config, uiVersion: normalized };
      const nextAudit = [...auditLog, entry].slice(-UICONFIG_AUDIT_MAX);
      setConfigState(nextConfig);
      setAuditLog(nextAudit);
      return persist(nextConfig, nextAudit)
        .then(() => ({ success: true }))
        .catch((e) => {
          if (__DEV__) console.warn('UIConfigContext persist error:', e);
          return { success: false, error: e?.message ?? 'Could not save UI version.' };
        });
    },
    [persist, config, auditLog]
  );

  return (
    <UIConfigContext.Provider
      value={{
        config,
        uiVersion: config.uiVersion,
        setUiVersion,
        auditLog,
      }}
    >
      {children}
    </UIConfigContext.Provider>
  );
};

export const useUIConfig = (): UIConfigContextType => {
  const context = useContext(UIConfigContext);
  if (!context) throw new Error('useUIConfig must be used within UIConfigProvider');
  return context;
};
