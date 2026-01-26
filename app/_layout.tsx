import { Stack } from 'expo-router';
import { FlagProvider } from '../components/FlagContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <FlagProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin/index" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </FlagProvider>
  );
}
