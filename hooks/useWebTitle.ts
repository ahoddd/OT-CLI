/**
 * Set document.title on web only. Use in screens/layouts for per-route titles.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

const DEFAULT_TITLE = 'OrbTap — Discover real places, earn points, redeem perks';

export function useWebTitle(title: string | undefined): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = title && title.trim() ? `${title.trim()} | OrbTap` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
