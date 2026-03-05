/**
 * Redirect: /deal/:cardId → /intent/deal/:cardId (Deal Done Card).
 * Keeps share links (dealDoneDeepLink) short: orbtap.com/deal/xyz
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';

export default function DealRedirect() {
  const { t } = useI18n();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (cardId) router.replace({ pathname: '/intent/deal/[cardId]', params: { cardId } } as any);
    else router.replace('/');
  }, [cardId, router]);

  return null;
}
