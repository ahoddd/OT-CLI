import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Returns whether the user prefers reduced motion. When true, disable pulse/breathing animations. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (isMounted) setReduceMotion(enabled ?? false);
      } catch {
        if (isMounted) setReduceMotion(false);
      }
    };

    fetch();

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      if (isMounted) setReduceMotion(enabled);
    });

    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduceMotion;
}
