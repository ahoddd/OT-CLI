import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { MOCK_POLLS } from '../../constants/Polls';
import { PollCard } from '../../components/PollCard';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrbVoteScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>ORB VOTE</Text>
            <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SPONSORED</Text>
        {MOCK_POLLS.filter(p => p.type === 'sponsored').map(p => <PollCard key={p.id} poll={p} />)}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FEATURED</Text>
        {MOCK_POLLS.filter(p => p.type === 'featured').map(p => <PollCard key={p.id} poll={p} />)}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT POLLS</Text>
        {MOCK_POLLS.filter(p => p.type === 'standard').map(p => <PollCard key={p.id} poll={p} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  backBtn: { padding: 8 },
  content: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, marginTop: 8 }
});
