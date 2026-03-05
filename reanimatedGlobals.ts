/**
 * Set Reanimated logger config on global before any worklet runs.
 * Fixes "Property '__reanimatedLoggerConfig' doesn't exist" in Expo Go / Hermes
 * when the worklet runtime's global doesn't allow adding properties.
 */
declare const global: typeof globalThis & {
  __reanimatedLoggerConfig?: {
    logFunction: (data: { level: number; message: string }) => void;
    level: number;
    strict: boolean;
  };
};

if (typeof global !== 'undefined' && global.__reanimatedLoggerConfig === undefined) {
  global.__reanimatedLoggerConfig = {
    logFunction: () => {},
    level: 1, // ReanimatedLogLevel.warn
    strict: false,
  };
}

export {};
