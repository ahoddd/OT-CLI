/**
 * Pro tier — redirects to consolidated Plans page with Pro tab selected.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../context/I18nContext';

export default function ProRedirect() {
  const { t } = useI18n();
  const router = useRouter();
  useEffect(() => {
    router.replace({ pathname: '/premium', params: { tier: 'pro' } } as any);
  }, []);
  return null;
}
