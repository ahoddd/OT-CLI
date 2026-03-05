/**
 * Development-only logger. In production (when __DEV__ is false), no-ops to avoid leaking logs.
 * Use instead of console.log/warn/error in app code; keep console in error boundaries for crash reports.
 */
const devOnly =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => {
    if (devOnly) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (devOnly) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (devOnly) console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (devOnly) console.debug(...args);
  },
};
