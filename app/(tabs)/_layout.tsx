import { Tabs } from 'expo-router';
import { useFlags } from '../../components/FlagContext';
import { Ionicons } from '@expo/vector-icons';

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
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Map',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="map" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="scan" 
        options={{ 
          title: 'Scan',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="qr-code" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="wallet" 
        options={{ 
          title: 'Wallet',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="wallet" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
