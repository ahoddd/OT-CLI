import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function LegalPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const getTitle = () => {
    switch(id) {
      case 'tos': return 'Terms of Service';
      case 'privacy': return 'Privacy Policy';
      case 'help': return 'Help Center';
      default: return 'Document';
    }
  };

  const getContent = () => {
    if (id === 'privacy') {
        return (
            <>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>1. DATA COLLECTION</Text>
                    <Text style={[styles.body, { color: colors.text }]}>
                        We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>2. LOCATION INFORMATION</Text>
                    <Text style={[styles.body, { color: colors.text }]}>
                        When you use the Services for transportation or delivery, we collect precise location data about the trip from the OrbTap app used by the Driver. If you permit the OrbTap app to access location services through the permission system used by your mobile operating system ("platform"), we may also collect the precise location of your device when the app is running in the foreground or background.
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>3. CONTACT INFORMATION</Text>
                    <Text style={[styles.body, { color: colors.text }]}>
                        If you permit the OrbTap app to access the address book on your device through the permission system used by your mobile platform, we may access and store names and contact information from your address book to facilitate social interactions through our Services.
                    </Text>
                </View>
            </>
        );
    }
    if (id === 'tos') {
        return (
            <>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>1. CONTRACTUAL RELATIONSHIP</Text>
                    <Text style={[styles.body, { color: colors.text }]}>
                        These Terms of Use ("Terms") govern the access or use by you, an individual, from within any country in the world of applications, websites, content, products, and services (the "Services") made available by OrbTap. PLEASE READ THESE TERMS CAREFULLY BEFORE ACCESSING OR USING THE SERVICES.
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>2. THE SERVICES</Text>
                    <Text style={[styles.body, { color: colors.text }]}>
                        The Services constitute a technology platform that enables users of OrbTap's mobile applications or websites provided as part of the Services (each, an "Application") to arrange and schedule logistics and/or logistics services with independent third party providers of such services, including independent third party transportation providers and independent third party logistics providers under agreement with OrbTap.
                    </Text>
                </View>
            </>
        );
    }
    // Default Help
    return (
        <>
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACCOUNT ISSUES</Text>
                <Text style={[styles.body, { color: colors.text }]}>
                    <Text style={{fontWeight:'bold'}}>Q: How do I reset my password?</Text>{"\n"}
                    A: Go to the login screen and tap "Forgot Password".{"\n\n"}
                    <Text style={{fontWeight:'bold'}}>Q: How do I delete my account?</Text>{"\n"}
                    A: Navigate to Settings &gt; Danger Zone &gt; Disconnect.
                </Text>
            </View>
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PAYMENTS & REWARDS</Text>
                <Text style={[styles.body, { color: colors.text }]}>
                    <Text style={{fontWeight:'bold'}}>Q: My points didn't update.</Text>{"\n"}
                    A: Try pulling down on the Wallet screen to refresh. If the issue persists, contact support@orbtap.com.
                </Text>
            </View>
        </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle().toUpperCase()}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {getContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  backBtn: { padding: 8 },
  content: { padding: 24 },
  body: { fontSize: 14, lineHeight: 24 },
  section: { borderBottomWidth: 1, borderBottomColor: 'rgba(100,100,100,0.1)', paddingBottom: 24, marginBottom: 24 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 }
});
