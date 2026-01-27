import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext'; // NEW
import { FlagProvider } from '../components/FlagContext';
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
        <WalletProvider>
          <FlagProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth/signup" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth/onboarding" options={{ gestureEnabled: false }} />
            </Stack>
            <StatusBar style="light" />
          </FlagProvider>
        </WalletProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
