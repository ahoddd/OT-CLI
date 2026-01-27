import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../hooks/useWallet';
import { useGamification } from '../../hooks/useGamification';
import { useTheme } from '../../hooks/useTheme';
import { PremiumCard } from '../../components/PremiumCard';
import { WalletActions } from '../../components/Wallet/WalletActions';
import { COLORS } from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function WalletScreen() {
  const { balance, history } = useWallet();
  const { rank } = useGamification();
  const { colors, isDark } = useTheme();
  
  const safeHistory = history || [];
  const [activeAction, setActiveAction] = useState<'send' | 'receive' | 'swap' | 'redeem' | null>(null);

  const handleAction = (type: any) => {
    Haptics.selectionAsync();
    setActiveAction(type);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WalletActions action={activeAction} onClose={() => setActiveAction(null)} balance={balance} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <SafeAreaView edges={['top']}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>ASSET VAULT</Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Portfolio Value: ${(balance * 0.05).toFixed(2)} USD</Text>
            </SafeAreaView>
            <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <Ionicons name="scan" size={20} color={colors.text} />
            </TouchableOpacity>
        </Animated.View>

        {/* THE CARD */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.cardContainer}>
            <PremiumCard balance={balance} rank={rank} />
        </Animated.View>

        {/* ACTIONS */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.actionsRow}>
            <ActionButton icon="paper-plane" label="Send" onPress={() => handleAction('send')} colors={colors} isDark={isDark} />
            <ActionButton icon="qr-code" label="Receive" onPress={() => handleAction('receive')} colors={colors} isDark={isDark} />
            <ActionButton icon="swap-horizontal" label="Swap" onPress={() => handleAction('swap')} colors={colors} isDark={isDark} />
            <ActionButton icon="gift" label="Redeem" onPress={() => handleAction('redeem')} colors={colors} isDark={isDark} />
        </Animated.View>

        {/* LEDGER */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
        </View>
        
        <View style={[styles.historyList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {safeHistory.map((item, index) => (
                <Animated.View 
                    key={item.id} 
                    entering={FadeInDown.delay(600 + (index * 50)).duration(500)}
                    style={[styles.historyItem, { borderBottomColor: colors.border }]}
                >
                    <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? (isDark ? 'rgba(74, 222, 128, 0.1)' : '#e6fcf5') : (isDark ? 'rgba(255,255,255,0.1)' : '#f1f3f5') }]}>
                        <Ionicons 
                            name={item.amount > 0 ? "arrow-down" : "arrow-up"} 
                            size={18} 
                            color={item.amount > 0 ? COLORS.success : colors.text} 
                        />
                    </View>
                    <View style={styles.historyInfo}>
                        <Text style={[styles.historyTitle, { color: colors.text }]}>{item.description}</Text>
                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                    </View>
                    <Text style={[styles.historyAmount, { color: item.amount > 0 ? COLORS.success : colors.text }]}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                    </Text>
                </Animated.View>
            ))}
            {safeHistory.length === 0 && (
                <Text style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic' }}>No transactions yet.</Text>
            )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ActionButton = ({ icon, label, onPress, colors, isDark }: any) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
        <View style={[styles.actionIcon, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#ccc',
            shadowOpacity: isDark ? 0 : 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: isDark ? 0 : 2
        }]}>
            <Ionicons name={icon} size={22} color={colors.text} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  headerSub: { fontSize: 12, marginTop: 4 },
  scanBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginTop: 4 },
  cardContainer: { alignItems: 'center', marginBottom: 30 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 10 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionLabel: { fontSize: 11, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  historyList: { borderRadius: 20, padding: 4, borderWidth: 1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyInfo: { flex: 1 },
  historyTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  historyDate: { fontSize: 10 },
  historyAmount: { fontWeight: 'bold', fontSize: 14 }
});
