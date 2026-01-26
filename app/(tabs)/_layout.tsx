import { Tabs } from 'expo-router';
import { useFlags } from '../../components/FlagContext';

export default function TabLayout() {
  const { flags, loading } = useFlags();

  if (loading) return null;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#000', borderTopColor: '#333' },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#666',
    }}>
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
