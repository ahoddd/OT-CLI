import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { TabBarOrb } from '../../components/TabBarOrb';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            tint={isDark ? "dark" : "light"} 
            intensity={80} 
            style={StyleSheet.absoluteFill} 
          />
        ),
        tabBarActiveTintColor: COLORS.neonBlue[0],
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={24} color={color} />,
        }}
      />
      
      {/* THE PULSING ORB */}
      <Tabs.Screen
        name="orb"
        options={{
          tabBarButton: () => <TabBarOrb />,
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
