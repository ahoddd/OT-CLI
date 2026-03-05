import '../reanimatedGlobals';
import { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { logScreenView } from '../services/analytics';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { clearUserLocalData, getLastUid, setLastUid } from '../utils/clearUserData';
import { I18nProvider } from '../context/I18nContext';
import { PushRegistration } from '../components/PushRegistration';
import { WalletProvider } from '../context/WalletContext';
import { LevelUpProvider } from '../context/LevelUpContext';
import { PreferencesProvider } from '../context/PreferencesContext';
import { FlagProvider } from '../components/FlagContext';
import { UIConfigProvider } from '../context/UIConfigContext';
import { AdminLayoutProvider } from '../context/AdminLayoutContext';
import { TutorialProvider } from '../context/TutorialContext';
import { TutorialConfigProvider } from '../context/TutorialConfigContext';
import { BookmarkProvider } from '../context/BookmarkContext';
import { OrbSwipeTrayProvider } from '../context/OrbSwipeTrayContext';
import { MenuProvider } from '../context/MenuContext';
import { KnowledgeProvider } from '../context/KnowledgeContext';
import { OrbinomicsProvider } from '../context/OrbinomicsContext';
import { MissionsProvider } from '../context/MissionsContext';
import { PartnersProvider } from '../context/PartnersContext';
import { MapHistoryProvider } from '../context/MapHistoryContext';
import { UserLocationProvider } from '../context/UserLocationContext';
import { SearchOpenProvider } from '../context/SearchOpenContext';
import { SearchOverlay } from '../components/SearchOverlay';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { RootErrorBoundary } from '../components/RootErrorBoundary';
import { NotificationResponseHandler } from '../components/NotificationResponseHandler';
import { MaintenanceGate } from '../components/MaintenanceGate';
import { BrandSplashScreen } from '../components/BrandSplashScreen';
import { useSearchOpen } from '../context/SearchOpenContext';
import { useUIConfig } from '../context/UIConfigContext';
import { initI18n } from '../utils/i18n';

SplashScreen.preventAutoHideAsync();

function GlobalSearchOverlay() {
  const ctx = useSearchOpen();
  if (!ctx) return null;
  return <SearchOverlay visible={ctx.searchVisible} onClose={ctx.closeSearch} defaultScope={ctx.defaultScope} />;
}

/**
 * User-dependent provider tree. Keyed by sessionKey so it remounts on account switch,
 * re-reading AsyncStorage and ensuring no stale data (wallet, level, streak, premium) bleeds.
 */
function UserSession() {
  return (
    <OrbinomicsProvider>
      <WalletProvider>
        <PreferencesProvider>
          <UserLocationProvider>
            <FlagProvider>
              <UIConfigProvider>
                <LevelUpProvider>
                  <MaintenanceGate>
                    <TutorialConfigProvider>
                      <TutorialProvider>
                        <AdminLayoutProvider>
                          <BookmarkProvider>
                            <OrbSwipeTrayProvider>
                            <MenuProvider>
                              <KnowledgeProvider>
                                <PartnersProvider>
                                  <MapHistoryProvider>
                                    <MissionsProvider>
                                      <SearchOpenProvider>
                                        <RootErrorBoundary>
                                          <AppStackWithUiKey />
                                          <GlobalSearchOverlay />
                                          <PushRegistration />
                                          <NotificationResponseHandler />
                                        </RootErrorBoundary>
                                      </SearchOpenProvider>
                                      <StatusBar style="light" />
                                    </MissionsProvider>
                                  </MapHistoryProvider>
                                </PartnersProvider>
                              </KnowledgeProvider>
                            </MenuProvider>
                          </OrbSwipeTrayProvider>
                          </BookmarkProvider>
                        </AdminLayoutProvider>
                      </TutorialProvider>
                    </TutorialConfigProvider>
                  </MaintenanceGate>
                </LevelUpProvider>
              </UIConfigProvider>
            </FlagProvider>
          </UserLocationProvider>
        </PreferencesProvider>
      </WalletProvider>
    </OrbinomicsProvider>
  );
}

/**
 * Ensures each user gets a fresh local state: on account switch (different signed-in user),
 * clears AsyncStorage then remounts the provider tree. On logout we do NOT clear so tutorial
 * state and preferences persist when the same user logs back in.
 */
function UserDataGate() {
  const { user } = useAuth();
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (processingRef.current) return;
    processingRef.current = true;

    (async () => {
      try {
        if (currentUid === null) {
          setSessionKey('anon');
          processingRef.current = false;
          return;
        }
        const lastUid = await getLastUid();
        if (lastUid === currentUid) {
          setSessionKey(currentUid);
        } else {
          setSessionKey(null);
          await clearUserLocalData();
          await setLastUid(currentUid);
          setSessionKey(currentUid);
        }
      } catch {
        setSessionKey(user?.uid ?? 'anon');
      } finally {
        processingRef.current = false;
      }
    })();
  }, [user?.uid]);

  if (sessionKey === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#60a5fa" size="large" />
      </View>
    );
  }

  return <View key={sessionKey} style={{ flex: 1 }}><UserSession /></View>;
}

/** Keys the app shell by uiVersion so when Admin saves a new UI version, the whole app remounts and applies the new theme everywhere. */
function AppStackWithUiKey() {
  const { uiVersion } = useUIConfig();
  return (
    <Stack
      key={uiVersion}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth/signup" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth/onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="learn" options={{ title: 'Learn More' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="notification-settings" options={{ title: 'Notification settings' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="full-settings" options={{ title: 'App settings' }} />
      <Stack.Screen name="compare-accounts" options={{ title: 'Compare plans' }} />
      <Stack.Screen name="premium" options={{ title: 'Premium' }} />
      <Stack.Screen name="pro" options={{ title: 'Pro' }} />
      <Stack.Screen name="partner-apply" options={{ title: 'Partner application' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const pathname = usePathname();
  const [loaded] = useFonts({
    // Add custom fonts here if needed
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (pathname) logScreenView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (loaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, i18nReady]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = 'OrbTap — Discover real places, earn points, redeem perks';
    const html = document.documentElement;
    const body = document.body;
    html.style.height = '100%';
    html.style.minHeight = '100vh';
    html.style.overflowX = 'hidden';
    body.style.height = '100%';
    body.style.minHeight = '100vh';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflowX = 'hidden';
    body.style.WebkitFontSmoothing = 'antialiased';
    body.style.MozOsxFontSmoothing = 'grayscale';
    const root = document.getElementById('root');
    if (root) {
      (root as HTMLElement).style.minHeight = '100vh';
      (root as HTMLElement).style.height = '100%';
    }
    const style = document.createElement('style');
    style.setAttribute('data-orbtap-web', 'true');
    style.textContent = [
      'html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }',
      'html, body { box-sizing: border-box; margin: 0; padding: 0; }',
      '* { box-sizing: inherit; }',
      'body { overscroll-behavior: none; }',
      'button, [role="button"], a, input, select, textarea { outline: 2px solid transparent; outline-offset: 2px; }',
      'button:focus-visible, [role="button"]:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline-color: #38bdf8; }',
      '::selection { background: rgba(56, 189, 248, 0.25); color: inherit; }',
      '::-webkit-scrollbar { width: 8px; height: 8px; }',
      '::-webkit-scrollbar-track { background: transparent; }',
      '::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }',
      '::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }',
    ].join('\n');
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch { /* already removed */ } };
  }, []);

  if (!loaded || !i18nReady) return null;

  return (
    <GestureHandlerRootView style={Platform.OS === 'web' ? { flex: 1, minHeight: '100vh', width: '100%' } : { flex: 1 }}>
      <I18nProvider>
      <AuthProvider>
        <UserDataGate />
      </AuthProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
