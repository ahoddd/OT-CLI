import React, { useEffect, useMemo, useRef } from 'react';
import { View, Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { TabBarOrb } from '../../components/TabBarOrb';
import { TabBarButtonWithSubmenu } from '../../components/TabBarButtonWithSubmenu';
import { useAdminLayout } from '../../context/AdminLayoutContext';
import {
  TAB_IDS,
  TAB_ICONS,
  DEFAULT_TAB_ORDER,
  MAX_NAVBAR_TABS,
  isPageVisible,
  PARTNER_TAB_IDS,
  DEFAULT_PARTNER_TAB_ORDER,
} from '../../constants/AdminConfig';
import type { TabId } from '../../constants/AdminConfig';
import { useFlags } from '../../components/FlagContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { useAuth } from '../../context/AuthContext';
import { isAdminEmail } from '../../constants/Admin';
import { useWallet } from '../../hooks/useWallet';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { useGlobalAnnouncement } from '../../hooks/useGlobalAnnouncement';
import { GlobalAnnouncementModal } from '../../components/GlobalAnnouncementModal';
import { GlobalAnnouncementBanner } from '../../components/GlobalAnnouncementBanner';
import { DirectoryOpenProvider } from '../../context/DirectoryOpenContext';
import { TabSubmenuProvider } from '../../context/TabSubmenuContext';
import { RootErrorBoundary } from '../../components/RootErrorBoundary';
import { useI18n } from '../../context/I18nContext';

const TAB_A11Y_KEYS: Record<string, string> = {
  index: 'tabs.home',
  orb: 'tabs.homeHoldScan',
  scan: 'tabs.scan',
  wallet: 'tabs.wallet',
  profile: 'tabs.profile',
  map: 'tabs.map',
  orbsignal: 'tabs.orbsignal',
  pulse: 'tabs.pulse',
  missions: 'tabs.missions',
  leaderboard: 'tabs.leaderboard',
  premium: 'tabs.premium',
  settings: 'tabs.settings',
  bookmarks: 'tabs.bookmarks',
  knowledge: 'tabs.knowledge',
  stats: 'tabs.stats',
  spheres: 'tabs.spheres',
  upgrades: 'tabs.upgrades',
  'compare-accounts': 'tabs.compareAccounts',
  partner: 'tabs.partner',
  admin: 'tabs.admin',
  intent: 'tabs.intent',
  orbpass: 'tabs.orbpass',
  'partner-orb': 'tabs.partnerCommand',
};

function TabButtonWithIllumination({
  tabId,
  tierColor,
  activeColor,
  children,
  ...rest
}: {
  tabId: string;
  tierColor: string | undefined;
  activeColor: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const pathname = usePathname();
  const focused = pathname != null && (pathname === `/(tabs)/${tabId}` || pathname.endsWith(`/${tabId}`) || pathname.includes(tabId));
  const tint = tierColor ?? activeColor;
  return (
    <TabBarButtonWithSubmenu tabId={tabId as TabId} {...rest}>
      <View style={styles.tabButtonWrap}>
        <View style={[
          styles.tabIconWrap,
          focused && tint && { backgroundColor: tint + '35', shadowColor: tint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
        ]}>
          {children}
        </View>
        {focused && <View style={[styles.tabDot, { backgroundColor: tint }]} />}
      </View>
    </TabBarButtonWithSubmenu>
  );
}

export default function TabLayout() {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { balance } = useWallet();
  const { tabOrder, tabHidden, loading } = useAdminLayout();
  const { flags } = useFlags();
  const { isPartner, testPartnerTier } = useEffectiveTier();
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { announcement, visible, dismiss, refresh: refreshAnnouncement } = useGlobalAnnouncement();
  const hasRedirectedToLanding = useRef(false);

  function getTabA11yLabel(name: string): string {
    const key = TAB_A11Y_KEYS[name];
    return key ? t(key) : name;
  }

  // Redirect unauthenticated users once; omit router from deps to avoid effect re-running every render (router ref can change)
  useEffect(() => {
    if (authLoading || user) {
      hasRedirectedToLanding.current = false;
      return;
    }
    if (hasRedirectedToLanding.current) return;
    hasRedirectedToLanding.current = true;
    router.replace('/');
  }, [authLoading, user]);

  useEffect(() => { refreshAnnouncement(); }, [refreshAnnouncement]);

  const showAdminFloating = isPartner && isAdminEmail(user?.email);
  const partnerTierColor = isPartner
    ? PARTNER_TIER_COLORS[(testPartnerTier ?? (myPartner?.tier ?? partners[0]?.tier as PartnerTier | undefined) ?? 'silver')]
    : undefined;
  const isBanner = announcement?.displayType === 'banner';
  const isBulletin = announcement?.displayType === 'bulletin' || !announcement?.displayType;

  const hiddenByFlag = TAB_IDS.filter((id) => !isPageVisible(id, flags));
  const partnerTabSet = new Set(PARTNER_TAB_IDS);
  const memberTabIds = (TAB_IDS as readonly string[]).filter((id) => !partnerTabSet.has(id as any));
  const hiddenIds = loading
    ? []
    : [
        ...new Set([
          ...tabHidden,
          ...hiddenByFlag,
          ...(isPartner ? memberTabIds : (PARTNER_TAB_IDS as unknown as TabId[])),
        ]),
      ].filter((id) => TAB_IDS.includes(id));
  const visibleOrder = loading
    ? [...DEFAULT_TAB_ORDER]
    : isPartner
      ? [...DEFAULT_PARTNER_TAB_ORDER]
      : tabOrder.filter((id) => !hiddenIds.includes(id)).slice(0, MAX_NAVBAR_TABS);
  const visibleSet = new Set(visibleOrder);
  const otherTabIds = TAB_IDS.filter((id) => !visibleSet.has(id));

  const tabBarHeight = Platform.OS === 'ios' ? 68 : 56;
  const tabBarActiveColor = partnerTierColor ?? COLORS.neonBlue[0];
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: tabBarHeight,
        paddingBottom: 0,
        backgroundColor: isDark
          ? (Platform.OS === 'web' ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.8)')
          : (Platform.OS === 'web' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)'),
        borderTopWidth: 0,
        elevation: 0,
        overflow: 'visible' as const,
        opacity: 1,
      },
      tabBarBackground: () =>
        Platform.OS === 'web' ? null : (
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={isDark ? 60 : 75} style={StyleSheet.absoluteFill} />
        ),
      tabBarActiveTintColor: tabBarActiveColor,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarShowLabel: true,
    }),
    [tabBarHeight, isDark, tabBarActiveColor, colors.textSecondary]
  );

  if (!authLoading && !user) {
    return null;
  }

  return (
    <DirectoryOpenProvider>
      <TabSubmenuProvider>
        <View style={{ flex: 1 }}>
          {isBanner && visible && announcement && (
            <GlobalAnnouncementBanner announcement={announcement} onDismiss={dismiss} />
          )}
          <RootErrorBoundary>
          <Tabs
            key={visibleOrder.join(',')}
            screenOptions={screenOptions}
            safeAreaInsets={{ bottom: 0 }}
            backBehavior="history"
          >
            {visibleOrder.map((name) => (
              <Tabs.Screen
                key={name}
                name={name as any}
                redirect={!loading && hiddenIds.includes(name)}
                options={{
                  href: undefined,
                  tabBarLabel: getTabA11yLabel(name),
                  tabBarAccessibilityLabel: name === 'orb' ? t('tabs.homeHoldScan') : name === 'partner-orb' ? t('tabs.partnerCommand') : getTabA11yLabel(name),
                  tabBarButton:
                    name === 'orb' || name === 'partner-orb'
                      ? () => <TabBarOrb />
                      : (props) => (
                          <TabButtonWithIllumination
                            tabId={name}
                            tierColor={partnerTierColor ?? undefined}
                            activeColor={tabBarActiveColor}
                            {...props}
                          >
                            {props.children}
                          </TabButtonWithIllumination>
                        ),
                  tabBarIcon:
                    name !== 'orb' && name !== 'partner-orb'
                      ? ({ color, size }) => (
                          <Ionicons
                            name={(TAB_ICONS[name] ?? 'ellipse') as any}
                            size={size ?? 24}
                            color={color}
                          />
                        )
                      : undefined,
                }}
              />
            ))}
          {otherTabIds.map((name) => (
            <Tabs.Screen
              key={name}
              name={name as any}
              redirect={!loading && hiddenIds.includes(name)}
              options={{ href: null }}
            />
          ))}
        </Tabs>
          </RootErrorBoundary>
        <View
          style={[
            styles.tabBarBalanceWrap,
            {
              bottom: tabBarHeight + 8,
            },
          ]}
          pointerEvents="box-none"
        >
          <OTPointsBalanceLink
            amount={balance}
            size={16}
            label={t('tabs.pts')}
            compact
            textColor={colors.text}
            style={[styles.tabBarBalancePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          />
        </View>
        {showAdminFloating && (
          <TouchableOpacity
            style={[styles.adminFloating, { backgroundColor: COLORS.gold[0], shadowColor: '#000' }]}
            onPress={() => router.push('/admin')}
            activeOpacity={0.9}
          >
            <Ionicons name="construct" size={18} color={colors.text} />
            <Text style={[styles.adminFloatingText, { color: colors.text }]}>Admin</Text>
          </TouchableOpacity>
        )}
        {isBulletin && <GlobalAnnouncementModal visible={visible} announcement={announcement} onDismiss={dismiss} />}
        </View>
      </TabSubmenuProvider>
    </DirectoryOpenProvider>
  );
}

const styles = StyleSheet.create({
  tabButtonWrap: { justifyContent: 'center', alignItems: 'center' },
  tabIconWrap: { justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 24 },
  tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  tabBarBalanceWrap: {
    position: 'absolute',
    left: 16,
    right: 0,
    alignItems: 'flex-start',
  },
  tabBarBalancePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  adminFloatingText: { fontSize: 12, fontWeight: '700' },
});
