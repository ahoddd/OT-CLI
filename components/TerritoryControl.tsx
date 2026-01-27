import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

export const TerritoryControl = ({ sphereName = "Neon Raiders" }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
            <View style={styles.row}>
                <Ionicons name="flag" size={16} color={COLORS.neonBlue[0]} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>TERRITORY CONTROL</Text>
            </View>
            <Text style={[styles.status, { color: COLORS.success }]}>ACTIVE</Text>
        </View>

        <View style={styles.content}>
            <View style={styles.sphereBadge}>
                <LinearGradient
                    colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                    style={styles.sphereIcon}
                >
                    <Ionicons name="people" size={20} color="#fff" />
                </LinearGradient>
            </View>
            <View>
                <Text style={[styles.controlledBy, { color: colors.textSecondary }]}>Controlled by</Text>
                <Text style={[styles.sphereName, { color: colors.text }]}>{sphereName}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>1.5x XP</Text>
            </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '75%', backgroundColor: COLORS.neonBlue[0] }]} />
            <View style={[styles.progressBar, { width: '25%', backgroundColor: colors.border }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>75% Dominance • 2h until reset</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, borderRadius: 16, padding: 16, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  status: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sphereBadge: { shadowColor: COLORS.neonBlue[0], shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: {width:0, height:0} },
  sphereIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  controlledBy: { fontSize: 10, fontWeight: 'bold' },
  sphereName: { fontSize: 16, fontWeight: '900' },
  bonusBadge: { backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gold[0] },
  bonusText: { color: COLORS.gold[0], fontWeight: 'bold', fontSize: 12 },
  progressContainer: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressBar: { height: '100%' },
  progressText: { fontSize: 10, textAlign: 'right', fontWeight: 'bold' }
});
