import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';
import { GameProvider } from '../context/GameContext';
import { PreferencesProvider } from '../context/PreferencesContext';
import { FlagProvider } from '../components/FlagContext';
import { BookmarkProvider } from '../context/BookmarkContext';
import { KnowledgeProvider } from '../context/KnowledgeContext';
import { OrbinomicsProvider } from '../context/OrbinomicsContext';
import { MissionsProvider } from '../context/MissionsContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OrbinomicsProvider>
        <WalletProvider>
          <GameProvider>
          <PreferencesProvider>
          <FlagProvider>
          <BookmarkProvider>
          <KnowledgeProvider>
          <MissionsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth/signup" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth/onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="learn" options={{ title: 'Learn More' }} />
            </Stack>
            <StatusBar style="light" />
          </MissionsProvider>
          </KnowledgeProvider>
          </BookmarkProvider>
          </FlagProvider>
          </PreferencesProvider>
          </GameProvider>
        </WalletProvider>
        </OrbinomicsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
