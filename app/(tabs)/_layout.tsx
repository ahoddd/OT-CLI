import { Tabs } from 'expo-router';
import { useFlags } from '../../components/FlagContext';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  const { loading } = useFlags();

  if (loading) return null;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#000', borderTopColor: '#333', height: 90, paddingTop: 10 },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#666',
      tabBarLabelStyle: { fontSize: 10, marginTop: 4 },
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
      
      {/* CENTRAL ORB TAB */}
      <Tabs.Screen 
        name="orb" 
        options={{ 
          title: '',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: focused ? '#fbbf24' : '#333',
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 20,
              borderWidth: 4,
              borderColor: '#000'
            }}>
              <Ionicons name="flash" size={28} color={focused ? '#000' : '#666'} />
            </View>
          )
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
