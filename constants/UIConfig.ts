/**
 * App-level UI config (admin-controlled).
 * Same persistence pattern as flags: AsyncStorage + audit log.
 * Default remains Classic; safe fallback if config missing or corrupt.
 */

export type UIVersion = 'classic';

export interface UIConfig {
  uiVersion: UIVersion;
}

export interface UIConfigAuditEntry {
  uiVersion: UIVersion;
  timestamp: number;
  /** Admin identifier when available (e.g. email); optional for local-only. */
  updatedBy?: string;
}

export const DEFAULT_UICONFIG: UIConfig = {
  uiVersion: 'classic',
};

export const UICONFIG_STORAGE_KEY = 'ORBTAP_UI_CONFIG_V1';
export const UICONFIG_AUDIT_KEY = 'ORBTAP_UI_CONFIG_AUDIT';
export const UICONFIG_AUDIT_MAX = 20;

const VALID_UI_VERSIONS: UIVersion[] = ['classic'];

/** Normalizes stored value to a valid UIVersion; unknown values fall back to classic. */
export function normalizeUIVersion(value: unknown): UIVersion {
  if (typeof value !== 'string') return DEFAULT_UICONFIG.uiVersion;
  if (value === 'classic') return 'classic';
  return DEFAULT_UICONFIG.uiVersion;
}

export function mergeUIConfigWithDefaults(parsed: Partial<UIConfig> | null): UIConfig {
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_UICONFIG };
  return {
    uiVersion: normalizeUIVersion(parsed.uiVersion),
  };
}
