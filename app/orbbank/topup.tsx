/**
 * OrbBank™ — Top-up screen (IAP packages).
 * Manual top-up: $1 = 100 OT Points via in-app purchase.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { ORB_BANK_TOPUP_PACKAGES } from '../../constants/OrbBankGoals';
import { showErrorAlert } from '../../utils/alert';

export default function OrbBankTopUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  const [selected, setSelected] = useState(ORB_BANK_TOPUP_PACKAGES[2].key); // popular default
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (purchasing) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPurchasing(true);
    try {
      // TODO: wire RevenueCat SDK purchase flow
      // For now show "coming soon"
      showErrorAlert(
        'Coming soon',
        'OrbBank IAP top-up is launching soon. Earn OT through missions and scans in the meantime!',
      );
    } catch {}
    setPurchasing(false);
  };

  const selectedPackage = ORB_BANK_TOPUP_PACKAGES.find(p => p.key === selected)!;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Top Up OT</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.hero, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[themeGold + '22', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={{ fontSize: 40 }}>💰</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Top up OT Points</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            $1 = 100 OT Points. Use them at any partner venue.
          </Text>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SELECT PACKAGE</Text>

        {ORB_BANK_TOPUP_PACKAGES.map((pkg, i) => {
          const isSelected = selected === pkg.key;
          return (
            <Animated.View key={pkg.key} entering={FadeInDown.delay(i * 60).duration(400)}>
              <TouchableOpacity
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: isSelected ? themeGold + '18' : colors.surface,
                    borderColor: isSelected ? themeGold : colors.border,
                  },
                ]}
                onPress={() => { safeHaptics.selectionAsync(); setSelected(pkg.key); }}
                activeOpacity={0.85}
              >
                {pkg.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: themeGold }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.packageRow}>
                  <View>
                    <Text style={[styles.packageLabel, { color: colors.text }]}>{pkg.label}</Text>
                    <Text style={[styles.packageOT, { color: themeGold }]}>{pkg.ot.toLocaleString()} OT</Text>
                    {pkg.bonus > 0 && (
                      <Text style={[styles.packageBonus, { color: colors.textSecondary }]}>
                        +{pkg.bonus.toLocaleString()} bonus OT
                      </Text>
                    )}
                  </View>
                  <View style={styles.packagePriceWrap}>
                    <Text style={[styles.packagePrice, { color: colors.text }]}>${pkg.usd}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={themeGold} />}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <TouchableOpacity
          style={[styles.purchaseBtn, { backgroundColor: themeGold, opacity: purchasing ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              Buy {selectedPackage.ot.toLocaleString()} OT for ${selectedPackage.usd} →
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.legalNote, { color: colors.textSecondary }]}>
          OT Points are non-transferable and have no cash value. Subject to OrbTap Terms of Service.
          Purchases processed via Apple/Google in-app purchase.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scroll: { paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
  hero: { borderRadius: 20, padding: 24, overflow: 'hidden', alignItems: 'center', gap: 8, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },
  packageCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, overflow: 'hidden' },
  popularBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  popularText: { fontSize: 10, fontWeight: '800', color: '#000' },
  packageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packageLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  packageOT: { fontSize: 22, fontWeight: '800' },
  packageBonus: { fontSize: 12, marginTop: 2 },
  packagePriceWrap: { alignItems: 'flex-end', gap: 4 },
  packagePrice: { fontSize: 22, fontWeight: '800' },
  purchaseBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  purchaseBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  legalNote: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 8 },
});
